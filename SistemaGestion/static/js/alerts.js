// ══════════════════════════════════════
//  SGAFAQ — alerts.js
//  Toast, validaciones y modales
// ══════════════════════════════════════

const $ = id => document.getElementById(id);

// ── TOAST ──────────────────────────────
function showToast(msg, type = 'success') {
  const icons = {
    success: 'bi-check-circle-fill',
    error:   'bi-x-circle-fill',
    info:    'bi-info-circle-fill'
  };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="bi ${icons[type] || icons.success}" style="font-size:15px;flex-shrink:0"></i>${msg}`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => {
    t.classList.add('hide');
    setTimeout(() => t.remove(), 400);
  }, 3400);
}

// ── MODALES ────────────────────────────
function openModal(id)  { $(id)?.classList.add('open');    }
function closeModal(id) { $(id)?.classList.remove('open'); }

// Cerrar modal al hacer clic fuera
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => {
    if (e.target === o) o.classList.remove('open');
  });
});

// ── HELPERS DE VALIDACIÓN ──────────────
function setErr(inputId, errId, msg) {
  $(inputId)?.classList.add('error');
  if ($(errId)) { $(errId).textContent = msg; $(errId).style.display = 'block'; }
}
function clrErr(inputId, errId) {
  $(inputId)?.classList.remove('error');
  if ($(errId)) { $(errId).textContent = ''; $(errId).style.display = 'none'; }
}

// ── VALIDACIÓN: LOGIN ──────────────────
function validateLogin() {
  const u = $('loginUser')?.value.trim();
  const p = $('loginPass')?.value;
  let ok = true;
  if (!u) { setErr('loginUser', 'loginUserErr', 'El usuario es requerido');    ok = false; } else clrErr('loginUser', 'loginUserErr');
  if (!p) { setErr('loginPass', 'loginPassErr', 'La contraseña es requerida'); ok = false; } else clrErr('loginPass', 'loginPassErr');
  if (!ok) return false;
  // Aquí conectar con tu backend
  return true;
}
// Enter en el campo contraseña
$('loginPass')?.addEventListener('keydown', e => { if (e.key === 'Enter') validateLogin(); });

// ── VALIDACIÓN: REGISTRAR ACTIVO ───────
function validateRegistrar() {
    let ok = true;
    
    // Helper para validar campo visible
    const validarCampo = (id, errId, mensaje, condicion) => {
        const campo = document.getElementById(id);
        const valor = campo?.value;
        
        if (condicion ? condicion(valor) : !valor || valor === '') {
            if (campo) campo.classList.add('error');
            const errorDiv = document.getElementById(errId);
            if (errorDiv) {
                errorDiv.textContent = mensaje;
                errorDiv.style.display = 'block';
            }
            ok = false;
        } else {
            if (campo) campo.classList.remove('error');
            const errorDiv = document.getElementById(errId);
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }
    };
    
    // Validar nombre
    const nombre = document.getElementById('rN')?.value.trim();
    if (!nombre) {
        validarCampo('rN', 'rNe', 'El nombre del activo es requerido');
    } else {
        const errDiv = document.getElementById('rNe');
        if (errDiv) errDiv.style.display = 'none';
        document.getElementById('rN')?.classList.remove('error');
    }
    
    // Validar edificio
    const edificio = document.getElementById('rE')?.value;
    if (!edificio || edificio === '') {
        validarCampo('rE', 'rEe', 'Debes seleccionar un edificio');
    } else {
        const errDiv = document.getElementById('rEe');
        if (errDiv) errDiv.style.display = 'none';
        document.getElementById('rE')?.classList.remove('error');
    }
    
    // Validar ubicación (tipo + detalle)
    const ubicacionTipo = document.getElementById('ubicacionTipo')?.value;
    const ubicacionDetalle = document.getElementById('ubicacionDetalle')?.value?.trim();
    
    if (!ubicacionTipo || ubicacionTipo === '') {
        const errDiv = document.getElementById('rLe');
        if (errDiv) {
            errDiv.textContent = 'Selecciona un tipo de ubicación y proporciona detalles';
            errDiv.style.display = 'block';
        }
        document.getElementById('ubicacionTipo')?.classList.add('error');
        ok = false;
    } else {
        document.getElementById('ubicacionTipo')?.classList.remove('error');
    }
    
    if (!ubicacionDetalle) {
        const errDiv = document.getElementById('rLe');
        if (errDiv) {
            errDiv.textContent = 'Selecciona un tipo de ubicación y proporciona detalles';
            errDiv.style.display = 'block';
        }
        document.getElementById('ubicacionDetalle')?.classList.add('error');
        ok = false;
    } else {
        document.getElementById('ubicacionDetalle')?.classList.remove('error');
        // Si ambos están bien, limpiar error general
        if (ubicacionTipo && ubicacionTipo !== '') {
            const errDiv = document.getElementById('rLe');
            if (errDiv) errDiv.style.display = 'none';
        }
    }
    
    // Validar garantía (cantidad + período)
    const garantiaCantidad = document.getElementById('garantiaCantidad')?.value;
    const garantiaPeriodo = document.getElementById('garantiaPeriodo')?.value;
    
    if (!garantiaCantidad || garantiaCantidad <= 0) {
        const errDiv = document.getElementById('rWe');
        if (errDiv) {
            errDiv.textContent = 'Ingresa una cantidad válida para la garantía y selecciona un período';
            errDiv.style.display = 'block';
        }
        document.getElementById('garantiaCantidad')?.classList.add('error');
        ok = false;
    } else {
        document.getElementById('garantiaCantidad')?.classList.remove('error');
    }
    
    if (!garantiaPeriodo || garantiaPeriodo === '') {
        const errDiv = document.getElementById('rWe');
        if (errDiv) {
            errDiv.textContent = 'Ingresa una cantidad válida para la garantía y selecciona un período';
            errDiv.style.display = 'block';
        }
        document.getElementById('garantiaPeriodo')?.classList.add('error');
        ok = false;
    } else {
        document.getElementById('garantiaPeriodo')?.classList.remove('error');
        // Si ambos están bien, limpiar error general
        if (garantiaCantidad && garantiaCantidad > 0) {
            const errDiv = document.getElementById('rWe');
            if (errDiv) errDiv.style.display = 'none';
        }
    }
    
    if (ok) {
        showToast('✅ Activo registrado correctamente', 'success');
    }
    
    return ok;
}

// ── VALIDACIÓN: EDITAR ACTIVO ──────────
function validateEditar() {
    const nombre = document.getElementById('edit_nombre')?.value.trim();
    const edificio = document.getElementById('edit_id_edificio')?.value;
    const ubicacionTipo = document.getElementById('edit_ubicacion_tipo')?.value;
    const ubicacionDetalle = document.getElementById('edit_ubicacion_detalle')?.value.trim();
    
    // Garantía - AHORA ES REQUERIDA
    const garantiaCantidad = document.getElementById('edit_garantia_cantidad')?.value;
    const garantiaPeriodo = document.getElementById('edit_garantia_periodo')?.value;
    
    const observaciones = document.getElementById('edit_observaciones')?.value;
    const fotoInput = document.getElementById('edit_foto');
    
    let ok = true;
    
    // Validar nombre (requerido)
    if (!nombre) {
        setErr('edit_nombre', 'edit_nombre_error', 'El nombre del activo es requerido');
        ok = false;
    } else if (nombre.length < 3) {
        setErr('edit_nombre', 'edit_nombre_error', 'El nombre debe tener al menos 3 caracteres');
        ok = false;
    } else if (nombre.length > 100) {
        setErr('edit_nombre', 'edit_nombre_error', 'El nombre no puede exceder 100 caracteres');
        ok = false;
    } else {
        clrErr('edit_nombre', 'edit_nombre_error');
    }
    
    // Validar edificio (requerido)
    if (!edificio || edificio === '') {
        setErr('edit_id_edificio', 'edit_edificio_error', 'Debes seleccionar un edificio');
        ok = false;
    } else {
        clrErr('edit_id_edificio', 'edit_edificio_error');
    }
    
    // Validar ubicación (requerida)
    let ubicacionCompleta = ubicacionTipo;
    if (ubicacionDetalle && ubicacionDetalle !== '') {
        ubicacionCompleta += ' ' + ubicacionDetalle;
    }
    
    if (!ubicacionCompleta || ubicacionCompleta.trim() === '' || ubicacionCompleta === ubicacionTipo) {
        setErr('edit_ubicacion_detalle', 'edit_ubicacion_error', 'La ubicación completa es requerida (selecciona tipo y escribe el detalle)');
        ok = false;
    } else if (ubicacionCompleta.length > 100) {
        setErr('edit_ubicacion_detalle', 'edit_ubicacion_error', 'La ubicación no puede exceder 100 caracteres');
        ok = false;
    } else {
        clrErr('edit_ubicacion_detalle', 'edit_ubicacion_error');
        document.getElementById('edit_ubicacion_hidden').value = ubicacionCompleta;
    }
    
    // Validar garantía (AHORA ES REQUERIDA)
    if (!garantiaCantidad || garantiaCantidad === '') {
        setErr('edit_garantia_cantidad', 'edit_garantia_error', 'La cantidad de garantía es requerida');
        ok = false;
    } else if (!garantiaPeriodo || garantiaPeriodo === '') {
        setErr('edit_garantia_periodo', 'edit_garantia_error', 'Debes seleccionar un período para la garantía');
        ok = false;
    } else {
        const cantidadNum = parseInt(garantiaCantidad);
        
        if (isNaN(cantidadNum) || cantidadNum < 1) {
            setErr('edit_garantia_cantidad', 'edit_garantia_error', 'La cantidad debe ser un número mayor a 0');
            ok = false;
        } else if (cantidadNum > 120) {
            setErr('edit_garantia_cantidad', 'edit_garantia_error', 'La cantidad no puede exceder 120');
            ok = false;
        } else {
            clrErr('edit_garantia_cantidad', 'edit_garantia_error');
            clrErr('edit_garantia_periodo', 'edit_garantia_error');
            
            // Generar el texto completo de garantía
            let garantiaTexto = '';
            if (cantidadNum === 1) {
                // Singular
                if (garantiaPeriodo === 'días') garantiaTexto = '1 día';
                else if (garantiaPeriodo === 'meses') garantiaTexto = '1 mes';
                else if (garantiaPeriodo === 'años') garantiaTexto = '1 año';
            } else {
                // Plural
                if (garantiaPeriodo === 'días') garantiaTexto = `${cantidadNum} días`;
                else if (garantiaPeriodo === 'meses') garantiaTexto = `${cantidadNum} meses`;
                else if (garantiaPeriodo === 'años') garantiaTexto = `${cantidadNum} años`;
            }
            document.getElementById('edit_garantia_hidden').value = garantiaTexto;
        }
    }
    
    // Validar observaciones (opcional)
    if (observaciones && observaciones.length > 500) {
        setErr('edit_observaciones', 'edit_observaciones_error', 'Las observaciones no pueden exceder 500 caracteres');
        ok = false;
    } else {
        clrErr('edit_observaciones', 'edit_observaciones_error');
    }
    
    // Validar foto (si se seleccionó una nueva)
    if (fotoInput && fotoInput.files && fotoInput.files[0]) {
        const file = fotoInput.files[0];
        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!tiposPermitidos.includes(file.type)) {
            setErr('edit_foto', 'edit_foto_error', 'Formato no permitido. Usa JPG, PNG, GIF o WEBP');
            ok = false;
        } else if (file.size > maxSize) {
            setErr('edit_foto', 'edit_foto_error', 'La imagen no puede exceder 5MB');
            ok = false;
        } else {
            clrErr('edit_foto', 'edit_foto_error');
        }
    }
    
    if (ok) {
        const garantiaFinal = document.getElementById('edit_garantia_hidden').value;
        console.log('✅ Validación exitosa:', {
            nombre: nombre,
            ubicacion: document.getElementById('edit_ubicacion_hidden').value,
            garantia: garantiaFinal,
            edificio: edificio
        });
        showToast('✓ Guardando cambios...', 'info');
    } else {
        showToast('❌ Por favor, completa todos los campos requeridos', 'error');
    }
    
    return ok;
}

// Función helper para establecer error
function setErr(inputId, errorId, mensaje) {
    const input = document.getElementById(inputId);
    const errorDiv = document.getElementById(errorId);
    
    if (input) {
        input.classList.add('error');
        input.style.borderColor = 'var(--red)';
    }
    
    if (errorDiv) {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
        errorDiv.style.color = 'var(--red)';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
    }
}

// Función helper para limpiar error
function clrErr(inputId, errorId) {
    const input = document.getElementById(inputId);
    const errorDiv = document.getElementById(errorId);
    
    if (input) {
        input.classList.remove('error');
        input.style.borderColor = '';
    }
    
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
}

// ── VALIDACIÓN: USUARIO (modal) ────────
function validateUsuario() {
  const nm = $('uName')?.value.trim();
  const un = $('uUsername')?.value.trim();
  const pw = $('uPassword')?.value;
  const em = $('uEmail')?.value.trim();
  const esNuevo = !$('uId')?.value; // si no hay id, es nuevo usuario
  let ok = true;
  if (!nm) { setErr('uName',     'uNameErr',     'Nombre requerido');        ok = false; } else clrErr('uName',     'uNameErr');
  if (!un) { setErr('uUsername', 'uUsernameErr', 'Usuario requerido');       ok = false; } else clrErr('uUsername', 'uUsernameErr');
  if (esNuevo && !pw)        { setErr('uPassword', 'uPasswordErr', 'Contraseña requerida');     ok = false; }
  else if (pw && pw.length < 6) { setErr('uPassword', 'uPasswordErr', 'Mínimo 6 caracteres');  ok = false; }
  else clrErr('uPassword', 'uPasswordErr');
  if (!em || !/^\S+@\S+\.\S+$/.test(em)) { setErr('uEmail', 'uEmailErr', 'Correo válido requerido'); ok = false; } else clrErr('uEmail', 'uEmailErr');
  if (ok) {
    showToast(esNuevo ? 'Usuario creado correctamente' : 'Usuario actualizado correctamente');
    closeModal('userModal');
  }
  return ok;
}

// ── FOTO: preview al subir imagen ──────
function prevPhoto(input, previewId) {
  const f = input.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) {
    showToast('La imagen supera los 5 MB', 'error');
    return;
  }
  const r = new FileReader();
  r.onload = e => {
    const p = $(previewId);
    if (p) { p.src = e.target.result; p.style.display = 'block'; }
  };
  r.readAsDataURL(f);
}

// ── SIDEBAR MOBILE ─────────────────────
function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebarOverlay')?.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('show');
  document.body.style.overflow = '';
}
document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
document.getElementById('menuBtn')?.addEventListener('click', openSidebar);
window.addEventListener('resize', () => { if (window.innerWidth > 768) closeSidebar(); });
