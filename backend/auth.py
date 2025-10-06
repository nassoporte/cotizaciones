# auth.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone

import crud, models, schemas
from database import SessionLocal

# --- Configuration ---
# In a real app, these should be in a .env file
SECRET_KEY = "a_very_secret_key_that_should_be_changed"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Token Creation ---

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Dependency to get DB session ---

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Dependency for getting the current authenticated account ---

def get_current_account(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.Account:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    account = crud.get_account_by_username(db, username=token_data.username)
    if account is None:
        raise credentials_exception
    return account

# Optional: Dependency for getting an active account
def get_current_active_account(current_account: models.Account = Depends(get_current_account)) -> models.Account:
    # In the future, you could add an `is_active` flag to the Account model
    # if not current_account.is_active:
    #     raise HTTPException(status_code=400, detail="Inactive account")
    return current_account

# --- Dependency for getting an admin account ---

def get_current_admin_account(current_account: models.Account = Depends(get_current_active_account)) -> models.Account:
    if current_account.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges",
        )
    return current_account
