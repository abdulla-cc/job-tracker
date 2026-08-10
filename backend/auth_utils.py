import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash

load_dotenv()

# ---- Password hashing (Argon2id) ----
password_hash = PasswordHash.recommended()


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password for storage. Never store the plaintext."""
    return password_hash.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a login attempt against the stored hash, in constant time."""
    return password_hash.verify(plain_password, hashed_password)


# ---- JWT ----
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is not set. Add it to backend/.env")


def create_access_token(user_id: int) -> str:
    """Create a signed JWT identifying the user, expiring after the configured window."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[int]:
    """Return the user_id from a valid token, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
