from pwdlib import PasswordHash

# Argon2id with recommended parameters. Salt and cost are handled internally.
password_hash = PasswordHash.recommended()


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password for storage. Never store the plaintext."""
    return password_hash.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a login attempt against the stored hash, in constant time."""
    return password_hash.verify(plain_password, hashed_password)
