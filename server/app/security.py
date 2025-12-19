from pwdlib import PasswordHash

ph = PasswordHash.recommended()


def verify_password(plain: str, hashed: str) -> bool:
    return ph.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return ph.hash(password)
