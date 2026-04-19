import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

SALT_ENV_VAR = "MEROSHARE_SALT"
DEFAULT_SALT = b"MeroShareSalt123"

def _get_salt() -> bytes:
    salt = os.environ.get(SALT_ENV_VAR)
    if salt:
        return salt.encode() if isinstance(salt, str) else salt
    return DEFAULT_SALT

def derive_key(pin: str) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_get_salt(),
        iterations=100000,
    )
    return kdf.derive(pin.encode())

def encrypt(pin: str, plaintext: str) -> str:
    key = derive_key(pin)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode('utf-8')

def decrypt(pin: str, encrypted_b64: str) -> str:
    key = derive_key(pin)
    aesgcm = AESGCM(key)
    encrypted_data = base64.b64decode(encrypted_b64.encode('utf-8'))
    nonce = encrypted_data[:12]
    ciphertext = encrypted_data[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode('utf-8')
