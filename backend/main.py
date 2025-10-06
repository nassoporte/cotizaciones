from fastapi import Depends, FastAPI, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse
from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader
import io
import shutil
import os

import crud, models, schemas, auth
from database import SessionLocal, engine

# --- Create database tables ---
# This will create the tables based on the models in models.py
models.Base.metadata.create_all(bind=engine)

# --- Constants & Setup ---
UPLOAD_DIRECTORY = "./uploads"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

env = Environment(loader=FileSystemLoader('.'))

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://cotizaciones-beryl.vercel.app"], # Adjust for your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIRECTORY), name="uploads")

# --- Authentication Endpoints ---

@app.post("/accounts/", response_model=schemas.Account, status_code=status.HTTP_201_CREATED)
def create_account(account: schemas.AccountCreate, db: Session = Depends(auth.get_db)):
    db_account = crud.get_account_by_username(db, username=account.username)
    if db_account:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_account(db=db, account=account)

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(auth.get_db)):
    account = crud.get_account_by_username(db, username=form_data.username)
    if not account or not crud.verify_password(form_data.password, account.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": account.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Account & Admin Endpoints ---

@app.get("/accounts/me", response_model=schemas.Account)
def read_account_me(current_account: models.Account = Depends(auth.get_current_active_account)):
    """
    Get current logged-in account details.
    """
    return current_account

@app.get("/accounts/", response_model=List[schemas.Account], dependencies=[Depends(auth.get_current_admin_account)])
def read_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(auth.get_db)):
    """
    Retrieve all accounts. Admin only.
    """
    accounts = crud.get_accounts(db, skip=skip, limit=limit)
    return accounts

@app.put("/accounts/{account_id}", response_model=schemas.Account, dependencies=[Depends(auth.get_current_admin_account)])
def update_account(account_id: int, account: schemas.AccountUpdate, db: Session = Depends(auth.get_db)):
    """
    Update an account. Admin only.
    """
    db_account = crud.update_account(db, account_id=account_id, account=account)
    if db_account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return db_account

@app.post("/accounts/{account_id}/delete", status_code=status.HTTP_200_OK)
def delete_account_with_password_endpoint(
    account_id: int,
    request_body: schemas.AccountDeleteWithPassword,
    db: Session = Depends(auth.get_db),
    current_admin: models.Account = Depends(auth.get_current_admin_account),
):
    """
    Delete a target account after verifying the admin's own password.
    Only accessible by admin users.
    """
    # Prevent admin from deleting their own account
    if account_id == current_admin.id:
        raise HTTPException(
            status_code=400, detail="Admin user cannot delete their own account"
        )

    # The CRUD function now handles password verification and deletion
    success = crud.delete_account_with_password(
        db=db,
        account_id=account_id,
        admin_account=current_admin,
        password=request_body.password,
    )

    if not success:
        # This can happen if the password is wrong or the target account doesn't exist.
        # For security, we'll give a generic error that leans towards auth failure.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta o cuenta inválida",
        )

    return {"message": "Cuenta y todos los datos asociados eliminados con éxito"}

# --- User (Asesor) Endpoints ---

@app.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    # Optional: Check if email is already used within the same account
    return crud.create_account_user(db=db, user=user, account_id=current_account.id)

@app.get("/users/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    return crud.get_users_by_account(db, account_id=current_account.id)

@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int, 
    user_in: schemas.UserUpdate, 
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    db_user = crud.update_user(db, user_id=user_id, account_id=current_account.id, user_in=user_in)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found in this account")
    return db_user

@app.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int, 
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    result = crud.delete_user(db, user_id=user_id, account_id=current_account.id)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found in this account")
    return result


# --- Client Endpoints ---

@app.post("/clients/", response_model=schemas.Client, status_code=status.HTTP_201_CREATED)
def create_client(
    client: schemas.ClientCreate, 
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    return crud.create_client(db=db, client=client, account_id=current_account.id)

@app.get("/clients/", response_model=List[schemas.Client])
def read_clients(
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    return crud.get_clients(db, account_id=current_account.id)

# --- Product Endpoints ---

@app.post("/products/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate, 
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    return crud.create_product(db=db, product=product, account_id=current_account.id)

@app.get("/products/", response_model=List[schemas.Product])
def read_products(
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    return crud.get_products(db, account_id=current_account.id)

# --- Quotation Endpoints ---

@app.post("/quotations/", response_model=schemas.Quotation, status_code=status.HTTP_201_CREATED)
def create_quotation(
    quotation: schemas.QuotationCreate, 
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    # Security check: Ensure the user (advisor) belongs to the current account
    user = db.query(models.User).filter(models.User.id == quotation.user_id, models.User.account_id == current_account.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User (advisor) not found in this account")
    return crud.create_quotation(db=db, quotation=quotation, user_id=user.id, account_id=current_account.id)

@app.get("/quotations/", response_model=List[schemas.Quotation])
def read_quotations(
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    return crud.get_quotations(db, account_id=current_account.id)

@app.get("/quotations/{quotation_id}", response_model=schemas.Quotation)
def read_quotation(
    quotation_id: int, 
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    db_quotation = crud.get_quotation(db, quotation_id=quotation_id, account_id=current_account.id)
    if db_quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return db_quotation

@app.put("/quotations/{quotation_id}", response_model=schemas.Quotation)
def update_quotation_endpoint(
    quotation_id: int,
    quotation_in: schemas.QuotationUpdate,
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    db_quotation = crud.update_quotation(
        db=db, 
        quotation_id=quotation_id, 
        quotation_in=quotation_in, 
        account_id=current_account.id
    )
    if db_quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return db_quotation

@app.delete("/quotations/{quotation_id}", status_code=status.HTTP_200_OK)
def delete_quotation(
    quotation_id: int, 
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    result = crud.delete_quotation(db, quotation_id=quotation_id, account_id=current_account.id)
    if result is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return result

@app.get("/quotations/{quotation_id}/pdf")
def generate_quotation_pdf(
    quotation_id: int, 
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    db_quotation = crud.get_quotation(db, quotation_id=quotation_id, account_id=current_account.id)
    if not db_quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    company_profile = crud.get_company_profile(db)
    terms_conditions = crud.get_or_create_terms_conditions(db, account_id=current_account.id)
    
    template = env.get_template("quotation_template.html")
    html_out = template.render(
        q=db_quotation, 
        company=company_profile, 
        terms=terms_conditions,
        base_url=f"http://127.0.0.1:8000"
    )

    pdf_bytes = HTML(string=html_out, base_url=f"http://127.0.0.1:8000").write_pdf()

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=cotizacion_{db_quotation.quotation_number}.pdf"}
    )

# --- Company Profile Endpoints (Now Protected) ---

@app.get("/company-profile/", response_model=schemas.CompanyProfile)
def get_company_profile_protected(
    db: Session = Depends(auth.get_db), 
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    return crud.get_company_profile(db)

@app.put("/company-profile/", response_model=schemas.CompanyProfile)
def update_company_profile_protected(
    profile_in: schemas.CompanyProfileCreate, 
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    return crud.update_company_profile(db, profile_in)

@app.post("/company-profile/logo", response_model=schemas.CompanyProfile)
def upload_logo_protected(
    file: UploadFile = File(...), 
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    file_path = os.path.join(UPLOAD_DIRECTORY, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    logo_url_path = f"/uploads/{file.filename}"
    return crud.update_logo_path(db, logo_path=logo_url_path)

# --- Terms and Conditions Endpoints ---

@app.get("/terms-conditions/", response_model=schemas.TermsConditions)
def get_terms_conditions(
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    """Retrieve the terms and conditions for the current user's account."""
    return crud.get_or_create_terms_conditions(db, account_id=current_account.id)

@app.put("/terms-conditions/", response_model=schemas.TermsConditions)
def update_terms_conditions_endpoint(
    terms_in: schemas.TermsConditionsUpdate,
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    """Update the terms and conditions for the current user's account."""
    return crud.update_terms_conditions(db, account_id=current_account.id, terms_in=terms_in)
