import os
import re
import secrets
from collections import Counter
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import (Flask, Response, flash, jsonify, redirect, render_template,
                   request, session, url_for)

from api_client import ApiError, api


app = Flask(__name__)
app.secret_key = os.getenv("WEB_SECRET_KEY", secrets.token_hex(32))
app.config.update(MAX_CONTENT_LENGTH=5 * 1024 * 1024, SESSION_COOKIE_HTTPONLY=True,
                  SESSION_COOKIE_SAMESITE="Lax", SESSION_COOKIE_SECURE=os.getenv("APP_ENV") == "production")


@app.before_request
def csrf_and_session():
    session.setdefault("csrf_token", secrets.token_urlsafe(32))
    # Compatibilidad con las claves que utilizan las plantillas web heredadas.
    session.setdefault("nombre_completo", session.get("nombre", session.get("username", "Usuario")))
    session.setdefault("foto_perfil", None)
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and not request.path.startswith("/api/"):
        token = request.form.get("csrf_token") or request.headers.get("X-CSRF-Token")
        if not secrets.compare_digest(token or "", session["csrf_token"]):
            return "Solicitud rechazada: token CSRF invalido", 400


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("access_token"):
            flash("Inicia sesion para continuar", "error")
            return redirect(url_for("login"))
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    @wraps(fn)
    @login_required
    def wrapper(*args, **kwargs):
        if session.get("rol") != "administrador":
            flash("Esta accion requiere una cuenta administradora", "error")
            return redirect(url_for("dashboard_usuario"))
        return fn(*args, **kwargs)
    return wrapper


def api_call(method, path, **kwargs):
    return api.request(method, path, **kwargs)


def split_name(full_name):
    parts = full_name.strip().split()
    return (parts[0], " ".join(parts[1:]) or ".")


def safe_username(value):
    base = value.split("@", 1)[0].lower()
    base = re.sub(r"[^a-z0-9_.-]", "", base)
    return (base or "usuario")[:50]


def user_tuple(user):
    full = f"{user.get('nombres', '')} {user.get('apellidos', '')}".strip()
    return (user["id"], user["username"], full, user["rol"].capitalize(), user.get("puesto"),
            user.get("edad"), user.get("domicilio"), None, 0)


def building_map():
    rows = api_call("GET", "catalogos/edificios")
    return rows, {row["id"]: row["nombre"] for row in rows}


def asset_tuple(asset, buildings):
    created = datetime.fromisoformat(asset["creado_en"].replace("Z", "+00:00"))
    return (asset["id"], asset["nombre"], buildings.get(asset.get("edificio_id"), "Sin edificio"),
            asset.get("ubicacion"), asset.get("garantia"), created.strftime("%Y-%m-%d"), None,
            f"media/activos/{asset['id']}/qr", asset.get("descripcion"), asset.get("edificio_id"))


@app.errorhandler(ApiError)
def handle_api_error(error):
    if error.status_code == 401:
        session.clear()
        flash("Tu sesion expiro; inicia sesion nuevamente", "error")
        return redirect(url_for("login"))
    flash(str(error), "error")
    target = request.referrer or (url_for("dashboard_admin") if session.get("rol") == "administrador" else url_for("login"))
    return redirect(target)


@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        tokens = api_call("POST", "auth/login", auth=False,
                          json={"username": request.form.get("user", "").strip(), "password": request.form.get("password", "")})
        session["access_token"], session["refresh_token"] = tokens["access_token"], tokens["refresh_token"]
        me = api_call("GET", "auth/me")
        full_name = f"{me['nombres']} {me['apellidos']}".strip()
        session.update(user_id=me["id"], username=me["username"], rol=me["rol"],
                       nombre=full_name, nombre_completo=full_name, foto_perfil=me.get("foto_url"))
        return redirect(url_for("dashboard_admin" if me["rol"] == "administrador" else "dashboard_usuario"))
    return render_template("login.html")


@app.route("/logout")
def logout():
    refresh = session.get("refresh_token")
    if refresh:
        try: api_call("POST", "auth/logout", auth=False, json={"refresh_token": refresh})
        except ApiError: pass
    session.clear()
    return redirect(url_for("login"))


@app.route("/dashboard_admin")
@admin_required
def dashboard_admin(): return render_template("dashboard_admin.html", username=session.get("username"))


@app.route("/dashboard_usuario")
@login_required
def dashboard_usuario(): return render_template("dashboard_usuario.html", username=session.get("username"))


@app.route("/crear_usuario", methods=["GET", "POST"])
@admin_required
def crear_usuario():
    if request.method == "POST":
        name, surname = split_name(request.form.get("nombre", ""))
        email = request.form.get("user", "").strip().lower()
        password = request.form.get("password", "")
        if password != request.form.get("password2", ""):
            flash("Las contrasenas no coinciden", "error"); return render_template("crear_usuario.html")
        payload = {"username": safe_username(email), "password": password, "nombres": name, "apellidos": surname,
                   "correo": email, "telefono": None, "puesto": request.form.get("puesto", "").strip(),
                   "edad": request.form.get("edad", type=int), "domicilio": request.form.get("domicilio", "").strip()}
        role = request.form.get("rol", "usuario").lower()
        created = api_call("POST", f"usuarios?rol={'administrador' if 'admin' in role else 'usuario'}", json=payload)
        if request.files.get("foto") and request.files["foto"].filename:
            photo = request.files["foto"]
            api_call("POST", f"usuarios/{created['id']}/foto", files={"archivo": (photo.filename, photo.stream, photo.mimetype)})
        flash("Usuario registrado exitosamente", "success")
        return redirect(url_for("editar_usuario"))
    return render_template("crear_usuario.html")


@app.route("/usuarios/editar", methods=["GET", "POST"])
@admin_required
def editar_usuario():
    if request.method == "POST":
        user_id = request.form.get("id_usuario", type=int)
        first, last = split_name(request.form.get("nombre", ""))
        payload = {"username": safe_username(request.form.get("user", "")), "nombres": first, "apellidos": last,
                   "puesto": request.form.get("puesto", ""), "edad": request.form.get("edad", type=int),
                   "domicilio": request.form.get("domicilio", "")}
        api_call("PATCH", f"usuarios/{user_id}", json=payload)
        photo = request.files.get("foto")
        if photo and photo.filename: api_call("POST", f"usuarios/{user_id}/foto", files={"archivo": (photo.filename, photo.stream, photo.mimetype)})
        flash("Usuario actualizado", "success")
        return redirect(url_for("editar_usuario"))
    users = [user_tuple(u) for u in api_call("GET", "usuarios")]
    return render_template("editar_usuario.html", usuarios=users)


@app.post("/usuarios/eliminar/<int:id_usuario>")
@admin_required
def eliminar_usuario(id_usuario):
    api_call("DELETE", f"usuarios/{id_usuario}")
    flash("Usuario eliminado definitivamente", "success")
    return redirect(url_for("editar_usuario"))


@app.get("/usuarios/info/<int:id_usuario>")
@admin_required
def info_usuario(id_usuario):
    user = next((u for u in api_call("GET", "usuarios") if u["id"] == id_usuario), None)
    return jsonify(user or {}), 200 if user else 404


def profile_page(template):
    me = api_call("GET", "auth/me")
    if request.method == "POST":
        first, last = split_name(request.form.get("nombre", ""))
        payload = {"nombres": first, "apellidos": last, "puesto": request.form.get("puesto", ""),
                   "edad": request.form.get("edad", type=int), "domicilio": request.form.get("domicilio", "")}
        password = request.form.get("password")
        if password:
            if password != request.form.get("password2"): flash("Las contrasenas no coinciden", "error"); return render_template(template, usuario=user_tuple(me)[1:8])
            payload["password"] = password
        me = api_call("PATCH", "auth/me", json=payload)
        photo = request.files.get("foto")
        if photo and photo.filename and session.get("rol") == "administrador": api_call("POST", f"usuarios/{me['id']}/foto", files={"archivo": (photo.filename, photo.stream, photo.mimetype)})
        session["nombre"] = session["nombre_completo"] = f"{me['nombres']} {me['apellidos']}".strip()
        session["foto_perfil"] = me.get("foto_url")
        flash("Perfil actualizado", "success")
    full = f"{me['nombres']} {me['apellidos']}".strip()
    data = (me["username"], full, me["rol"].capitalize(), me.get("puesto"), me.get("edad"), me.get("domicilio"), None)
    return render_template(template, usuario=data)


@app.route("/perfil/editar", methods=["GET", "POST"])
@login_required
def editar_perfil(): return profile_page("editar_perfil.html")


@app.route("/perfil/editar/usuario", methods=["GET", "POST"])
@login_required
def editar_perfil_usuario(): return profile_page("editar_perfil_usuario.html")


def register_asset(template):
    buildings, _ = building_map()
    if request.method == "POST":
        payload = {"nombre": request.form.get("nombre", "").strip(), "descripcion": request.form.get("observaciones") or None,
                   "edificio_id": request.form.get("id_edificio", type=int), "ubicacion": request.form.get("ubicacion") or None,
                   "garantia": request.form.get("garantia") or None}
        asset = api_call("POST", "activos", json=payload)
        photo = request.files.get("foto")
        if photo and photo.filename: api_call("POST", f"activos/{asset['id']}/foto", files={"archivo": (photo.filename, photo.stream, photo.mimetype)})
        flash(f"Activo registrado con folio {asset['folio']}", "success")
        return render_template(template, edificios=[(b["id"], b["nombre"]) for b in buildings], activo_registrado=True,
                               id_activo=asset["id"], nombre=asset["nombre"], qr_path=f"media/activos/{asset['id']}/qr")
    return render_template(template, edificios=[(b["id"], b["nombre"]) for b in buildings])


@app.route("/registrar_activo", methods=["GET", "POST"])
@admin_required
def registrar_activo(): return register_asset("registrar_activo.html")


@app.route("/registrar_activo/usuario", methods=["GET", "POST"])
@login_required
def registrar_activo_usuario(): return register_asset("registrar_activo_usuario.html")


def inventory(template):
    buildings, names = building_map()
    assets = [asset_tuple(a, names) for a in api_call("GET", "activos?limit=500") if a.get("activo")]
    return render_template(template, activos=assets, edificios=[(b["id"], b["nombre"]) for b in buildings])


@app.get("/inventario_general")
@admin_required
def inventario_general(): return inventory("inventario_general.html")


@app.get("/inventario_general/usuario")
@login_required
def inventario_general_usuario(): return inventory("inventario_general_usuario.html")


def update_asset():
    asset_id = request.form.get("id_activo", type=int)
    payload = {"nombre": request.form.get("nombre", "").strip(), "descripcion": request.form.get("observaciones") or None,
               "edificio_id": request.form.get("id_edificio", type=int), "ubicacion": request.form.get("ubicacion") or None,
               "garantia": request.form.get("garantia") or None}
    api_call("PATCH", f"activos/{asset_id}", json=payload)
    photo = request.files.get("foto")
    if photo and photo.filename: api_call("POST", f"activos/{asset_id}/foto", files={"archivo": (photo.filename, photo.stream, photo.mimetype)})
    flash("Activo actualizado", "success")


@app.post("/editar_activo")
@admin_required
def editar_activo(): update_asset(); return redirect(url_for("inventario_general"))


@app.route("/editar_activo/usuario", methods=["GET", "POST"])
@login_required
def editar_activo_usuario():
    if request.method == "POST": update_asset(); return redirect(url_for("inventario_general_usuario"))
    return redirect(url_for("inventario_general_usuario"))


@app.post("/activos/eliminar/<int:id_activo>")
@admin_required
def eliminar_activo(id_activo): api_call("DELETE", f"activos/{id_activo}"); flash("Activo retirado del inventario", "success"); return redirect(url_for("inventario_general"))


@app.post("/activos/eliminar/<int:id_activo>/usuario")
@login_required
def eliminar_activo_usuario(id_activo): return eliminar_activo(id_activo)


@app.get("/ver_activo/<int:id_activo>")
@login_required
def ver_activo(id_activo):
    asset = api_call("GET", f"activos/{id_activo}")
    created = datetime.fromisoformat(asset["creado_en"].replace("Z", "+00:00"))
    data = (asset["nombre"], asset.get("ubicacion"), asset.get("garantia"), created.strftime("%Y-%m-%d"),
            created.strftime("%H:%M"), None, f"media/activos/{id_activo}/qr", asset.get("descripcion"))
    return render_template("ver_activo.html", activo=data, historial=[])


@app.get("/media/activos/<int:id_activo>/<kind>")
@login_required
def asset_media(id_activo, kind):
    if kind not in {"qr", "foto"}: return "No encontrado", 404
    content = api_call("GET", f"activos/{id_activo}/{kind}")
    return Response(content, mimetype="image/png" if kind == "qr" else "image/jpeg")


@app.get("/escanear_activo")
@login_required
def escanear_activo(): return render_template("escanear.html")


@app.get("/api/activos")
@login_required
def api_activos(): return jsonify(api_call("GET", "activos?limit=500"))


@app.get("/api/buscar_activo")
@login_required
def api_buscar_activo():
    term = request.args.get("q", "").strip()
    assets = api_call("GET", f"activos?buscar={term}&limit=20")
    exact = next((a for a in assets if a["folio"].lower() == term.lower() or a["codigo_qr"].lower() == term.lower()), None)
    return jsonify({"encontrado": bool(exact), "activo": exact, "resultados": assets})


@app.get("/api/buscar_sugerencias")
@login_required
def api_buscar_sugerencias(): return jsonify(api_call("GET", f"activos?buscar={request.args.get('q','')}&limit=8"))


@app.get("/api/activos_recientes")
@login_required
def api_activos_recientes():
    rows = api_call("GET", f"activos?limit={request.args.get('limite', 5)}")
    return jsonify(sorted(rows, key=lambda x: x["creado_en"], reverse=True))


@app.get("/historial_movimientos")
@admin_required
def historial_movimientos():
    buildings, _ = building_map(); users = api_call("GET", "usuarios")
    return render_template("historial_movimientos.html", historial=[], edificios=[(b["id"], b["nombre"]) for b in buildings], usuarios=[user_tuple(u) for u in users])


@app.get("/historial_movimientos/usuario")
@login_required
def historial_movimientos_usuario():
    buildings, _ = building_map()
    return render_template("historial_movimientos_usuario.html", historial=[], edificios=[(b["id"], b["nombre"]) for b in buildings], usuarios=[])


@app.get("/api/detalle_historial/<int:id_historial>")
@app.get("/api/detalle_historial/<int:id_historial>/usuario")
@login_required
def api_detalle_historial(id_historial): return jsonify([])


@app.route("/api/validar_correo", methods=["GET", "POST"])
def api_validar_correo(): return jsonify({"valido": True})


@app.post("/api/enviar_correo_bienvenida")
def enviar_correo_bienvenida(): return jsonify({"ok": True, "mensaje": "Usuario creado; correo no configurado"})


def stats_data():
    assets = api_call("GET", "activos?limit=500")
    audits = api_call("GET", "auditorias")
    buildings, names = building_map()
    return assets, audits, buildings, names


@app.get("/api/dashboard_stats")
@login_required
def dashboard_stats():
    assets, audits, buildings, _ = stats_data()
    return jsonify({"total_activos": len(assets), "total_edificios": len(buildings), "total_auditorias": len(audits),
                    "activos_hoy": sum(a["creado_en"][:10] == datetime.now(timezone.utc).date().isoformat() for a in assets)})


@app.get("/api/usuarios_stats")
@admin_required
def usuarios_stats(): return jsonify({"total": len(api_call("GET", "usuarios"))})


@app.get("/api/activos_por_edificio")
@login_required
def api_activos_por_edificio():
    assets, _, buildings, names = stats_data(); counts = Counter(names.get(a.get("edificio_id"), "Sin edificio") for a in assets)
    return jsonify([{"edificio": name, "cantidad": count} for name, count in counts.items()])


@app.get("/api/activos_por_fecha")
@app.get("/api/activos_por_usuario_semana")
@app.get("/api/movimientos_por_semana")
@login_required
def empty_series(): return jsonify([])


@app.get("/api/stats_usuario/<int:usuario_id>")
@app.get("/api/stats_movimientos_usuario/<int:usuario_id>")
@login_required
def empty_user_stats(usuario_id): return jsonify({"total": 0})


@app.get("/api/movimientos_stats")
@app.get("/api/activos_antiguos_stats")
@login_required
def empty_stats(): return jsonify({"total": 0})


@app.get("/api/activos_por_antiguedad")
@app.get("/api/movimientos_recientes")
@app.get("/api/editores_mas_activos")
@login_required
def empty_list_stats(): return jsonify([])


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=os.getenv("APP_DEBUG", "false").lower() == "true")
