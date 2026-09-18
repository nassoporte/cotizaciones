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
UPLOAD_DIRECTORY = "./data/uploads"
FONDOS_DIRECTORY = "./data/fondos"
LOGOS_DIRECTORY = "./data/logos"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)
if not os.path.exists(FONDOS_DIRECTORY):
    os.makedirs(FONDOS_DIRECTORY)
if not os.path.exists(LOGOS_DIRECTORY):
    os.makedirs(LOGOS_DIRECTORY)

env = Environment(loader=FileSystemLoader('.'))

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir cualquier origen para desarrollo/entornos controlados
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIRECTORY), name="uploads")
app.mount("/fondos", StaticFiles(directory=FONDOS_DIRECTORY), name="fondos")
app.mount("/logos", StaticFiles(directory=LOGOS_DIRECTORY), name="logos")

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

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account),
):
    db_user = crud.get_user(db, user_id=user_id, account_id=current_account.id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found in this account")
    return db_user

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

@app.get("/clients/{client_id}", response_model=schemas.Client)
def read_client(
    client_id: int,
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account),
):
    db_client = crud.get_client(db, client_id=client_id, account_id=current_account.id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@app.put("/clients/{client_id}", response_model=schemas.Client)
def update_client(
    client_id: int,
    client: schemas.ClientCreate,
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account),
):
    db_client = crud.update_client(db, client_id=client_id, client=client, account_id=current_account.id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@app.delete("/clients/{client_id}", status_code=status.HTTP_200_OK)
def delete_client(
    client_id: int,
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account),
):
    db_client = crud.delete_client(db, client_id=client_id, account_id=current_account.id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted successfully"}

# Productos

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

@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product_endpoint(
    product_id: int,
    product_in: schemas.ProductUpdate,
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    db_product = crud.update_product(
        db=db, 
        product_id=product_id, 
        product_in=product_in, 
        account_id=current_account.id
    )
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

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

    company_profile = crud.get_company_profile(db, account_id=current_account.id)
    terms_conditions = crud.get_or_create_terms_conditions(db, account_id=current_account.id)

    # Determine the document title based on the quotation status
    document_title = "Cotización"
    if db_quotation.status == 'accepted' and db_quotation.payment_status == 'pagada':
        document_title = "Orden de Servicio"
    
    template = env.get_template("quotation_template.html")
    html_out = template.render(
        q=db_quotation, 
        company=company_profile, 
        terms=terms_conditions,
        document_title=document_title,
        footer_text=company_profile.footer_text or "Si usted tiene alguna pregunta sobre esta cotización, por favor, póngase en contacto con nosotros",
        footer_thanks=company_profile.footer_thanks or "¡Gracias por hacer negocios con nosotros!",
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
    return crud.get_company_profile(db, account_id=current_account.id)

@app.put("/company-profile/", response_model=schemas.CompanyProfile)
def update_company_profile_protected(
    profile_in: schemas.CompanyProfileUpdate, 
    db: Session = Depends(auth.get_db),
    current_account: models.Account = Depends(auth.get_current_active_account)
):
    return crud.update_company_profile(db, profile_in, account_id=current_account.id)

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
    return crud.update_logo_path(db, logo_path=logo_url_path, account_id=current_account.id)

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


# --- App Settings Endpoints (Global Login Background) ---

def get_or_create_app_settings(db: Session) -> models.AppSettings:
    settings = db.query(models.AppSettings).first()
    if not settings:
        settings = models.AppSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.get("/app-settings/", response_model=schemas.AppSettings)
def get_app_settings(db: Session = Depends(auth.get_db)):
    """Public endpoint: returns global app settings (login background, etc). No auth required."""
    return get_or_create_app_settings(db)

@app.put("/app-settings/", response_model=schemas.AppSettings, dependencies=[Depends(auth.get_current_admin_account)])
def update_app_settings(
    settings_in: schemas.AppSettingsUpdate,
    db: Session = Depends(auth.get_db)
):
    """Update global app settings. Admin only."""
    settings = get_or_create_app_settings(db)
    update_data = settings_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings

@app.post("/app-settings/upload-background", response_model=schemas.AppSettings, dependencies=[Depends(auth.get_current_admin_account)])
def upload_login_background(
    file: UploadFile = File(...),
    db: Session = Depends(auth.get_db)
):
    """Upload a new login background image. Admin only."""
    import uuid as uuid_lib
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp", ".mp4"]:
        from fastapi import HTTPException as FHE
        raise FHE(status_code=400, detail="Formato no soportado. Usar PNG, JPG, WEBP o MP4.")

    bg_dir = "./data/fondos"
    os.makedirs(bg_dir, exist_ok=True)

    filename = f"bg_{uuid_lib.uuid4().hex}{ext}"
    filepath = os.path.join(bg_dir, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    settings = get_or_create_app_settings(db)
    settings.fondo_login_url = filename
    db.commit()
    db.refresh(settings)
    return settings

@app.post("/app-settings/upload-logo-app", response_model=schemas.AppSettings, dependencies=[Depends(auth.get_current_admin_account)])
def upload_app_logo(
    file: UploadFile = File(...),
    db: Session = Depends(auth.get_db)
):
    """Upload the application logo (shown in sidebar and login). Admin only."""
    import uuid as uuid_lib
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp", ".svg"]:
        raise HTTPException(status_code=400, detail="Formato no soportado. Usar PNG, JPG, WEBP o SVG.")

    logos_dir = "/app/data/logos" if os.path.exists("/app/data") else LOGOS_DIRECTORY
    os.makedirs(logos_dir, exist_ok=True)

    filename = f"logo_app_{uuid_lib.uuid4().hex}{ext}"
    filepath = os.path.join(logos_dir, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    settings = get_or_create_app_settings(db)
    settings.logo_app_url = filename
    db.commit()
    db.refresh(settings)
    return settings

@app.get("/app-settings/fondos/disponibles", dependencies=[Depends(auth.get_current_active_account)])
def list_available_backgrounds():
    """List all uploaded background files."""
    bg_dir = "./data/fondos"
    os.makedirs(bg_dir, exist_ok=True)
    valid_exts = {".png", ".jpg", ".jpeg", ".webp", ".mp4"}
    files = []
    try:
        for f in sorted(os.listdir(bg_dir)):
            if os.path.splitext(f)[1].lower() in valid_exts:
                files.append(f)
    except Exception:
        pass
    return {"fondos": files}
