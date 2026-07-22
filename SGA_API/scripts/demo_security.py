"""Demostracion segura de los controles criptograficos del SGA.

No imprime secretos, llaves ni contrasenas reales.
Ejecutar desde SGA_API: python scripts/demo_security.py
"""
from hashlib import sha256
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import (create_access_token, create_refresh_token, decode_access_token,
                               decrypt_value, encrypt_value, hash_password, verify_password)


def main() -> None:
    demo_password = "Demostracion123!"
    password_hash = hash_password(demo_password)
    encrypted_phone = encrypt_value("4420000000")
    evidence = b"evidencia-de-demostracion"
    access = create_access_token("42", "auditor")
    refresh, refresh_jti_hash, _ = create_refresh_token("42")
    claims = decode_access_token(access)

    print("1. BCRYPT")
    print(f"   Hash: {password_hash}")
    print(f"   Verificacion correcta: {verify_password(demo_password, password_hash)}")
    print(f"   Verificacion incorrecta: {verify_password('Incorrecta123!', password_hash)}")
    print("2. FERNET")
    print(f"   Valor cifrado: {encrypted_phone}")
    print(f"   Descifrado autorizado: {decrypt_value(encrypted_phone)}")
    print("3. SHA-256")
    print(f"   Evidencia: {sha256(evidence).hexdigest()}")
    print(f"   JTI refresh almacenado como hash: {refresh_jti_hash}")
    print("4. JWT")
    print(f"   Access token generado: {access[:30]}... (oculto)")
    print(f"   Claims verificados: sub={claims['sub']}, role={claims['role']}, type={claims['type']}, jti={claims['jti']}")
    print(f"   Refresh token generado: {refresh[:30]}... (oculto)")


if __name__ == "__main__":
    main()
