from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from auth_utils import decode_access_token
from database import get_session
from models import User

# Reads the "Authorization: Bearer <token>" header. tokenUrl points /docs at the
# login endpoint (built next step); it does not create that endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    """Resolve the logged-in user from the bearer token, or raise 401."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_error

    user = session.get(User, user_id)
    if user is None:
        raise credentials_error

    return user
