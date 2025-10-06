from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import datetime
import secrets

import models, schemas
from passlib.context import CryptContext

# --- Security and Authentication ---

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_account_by_username(db: Session, username: str):
    return db.query(models.Account).filter(func.lower(models.Account.username) == func.lower(username)).first()

# --- Account (Titular) Functions ---

def get_account(db: Session, account_id: int):
    return db.query(models.Account).filter(models.Account.id == account_id).first()

def get_accounts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Account).offset(skip).limit(limit).all()

def create_account(db: Session, account: schemas.AccountCreate):
    # Check if any account exists to determine the role
    account_count = db.query(models.Account).count()
    role = "admin" if account_count == 0 else "user"

    hashed_password = get_password_hash(account.password)
    db_account = models.Account(
        username=account.username,
        full_name=account.full_name,
        hashed_password=hashed_password,
        role=role
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)

    # Create default terms and conditions for the new account
    default_terms_content = (
        "1. Al cliente se le cobrará 70 % después de aceptada esta cotización.\n"
        "2. El pago será debitado antes de la entrega de bienes y servicios.\n"
        "3. Por favor enviar la cotización firmada al email indicado anteriormente.\n"
        "4. Esta cotización no incluye IVA si requiere Factura Favor de indicar."
    )
    db_terms = models.TermsConditions(
        content=default_terms_content,
        account_id=db_account.id
    )
    db.add(db_terms)
    db.commit()
    db.refresh(db_account) # Refresh to get the relationship loaded

    return db_account

def update_account(db: Session, account_id: int, account: schemas.AccountUpdate):
    db_account = get_account(db, account_id=account_id)
    if not db_account:
        return None
    update_data = account.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_account, key, value)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def delete_account_with_password(db: Session, *, account_id: int, admin_account: models.Account, password: str) -> bool:
    """Verifies admin password and then deletes the target account."""
    # 1. Verify the admin's own password
    if not verify_password(password, admin_account.hashed_password):
        return False # Password incorrect

    # 2. Get the account to be deleted
    db_account = get_account(db, account_id=account_id)
    if not db_account:
        return False # Target account not found, though this shouldn't happen if called correctly

    # 3. Delete the account (cascading delete will handle the rest)
    db.delete(db_account)
    db.commit()
    return True


# --- User (Asesor) Functions ---

def get_user(db: Session, user_id: int, account_id: int):
    return db.query(models.User).filter(models.User.id == user_id, models.User.account_id == account_id).first()

def get_user_by_email(db: Session, email: str):
    # This can be used to check for duplicate emails within an account if needed
    return db.query(models.User).filter(models.User.email == email).first()

def get_users_by_account(db: Session, account_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.User).filter(models.User.account_id == account_id).offset(skip).limit(limit).all()

def create_account_user(db: Session, user: schemas.UserCreate, account_id: int):
    # Auto-generate a secure password
    random_password = secrets.token_urlsafe(16)
    hashed_password = get_password_hash(random_password)
    
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        hashed_password=hashed_password,
        account_id=account_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, account_id: int, user_in: schemas.UserUpdate):
    db_user = get_user(db, user_id=user_id, account_id=account_id)
    if not db_user:
        return None
    update_data = user_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int, account_id: int):
    db_user = get_user(db, user_id=user_id, account_id=account_id)
    if not db_user:
        return None
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}


# --- Client Functions (Scoped by Account) ---

def get_clients(db: Session, account_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Client).filter(models.Client.account_id == account_id).offset(skip).limit(limit).all()

def create_client(db: Session, client: schemas.ClientCreate, account_id: int):
    db_client = models.Client(**client.dict(), account_id=account_id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

# --- Product Functions (Scoped by Account) ---

def get_products(db: Session, account_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Product).filter(models.Product.account_id == account_id).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate, account_id: int):
    db_product = models.Product(**product.dict(), account_id=account_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# --- Quotation Number Generation (Per Account) ---

def _get_next_quotation_number(db: Session, account_id: int) -> str:
    last_quotation = db.query(models.Quotation).filter(models.Quotation.account_id == account_id).order_by(models.Quotation.id.desc()).first()
    
    if not last_quotation or not last_quotation.quotation_number.isdigit():
        return "1"
    
    last_number = int(last_quotation.quotation_number)
    return str(last_number + 1)

# --- Quotation Functions (Scoped by Account) ---

def get_quotation(db: Session, quotation_id: int, account_id: int):
    return (
        db.query(models.Quotation)
        .options(
            joinedload(models.Quotation.client),
            joinedload(models.Quotation.user),
            joinedload(models.Quotation.items).joinedload(models.QuotationItem.product)
        )
        .filter(models.Quotation.id == quotation_id, models.Quotation.account_id == account_id)
        .first()
    )

def get_quotations(db: Session, account_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Quotation)
        .filter(models.Quotation.account_id == account_id)
        .options(joinedload(models.Quotation.client), joinedload(models.Quotation.user))
        .order_by(models.Quotation.id.desc()).offset(skip).limit(limit).all()
    )

def create_quotation(db: Session, quotation: schemas.QuotationCreate, user_id: int, account_id: int):
    # 1. Calculate totals
    subtotal = sum(item.unit_price * item.quantity for item in quotation.items)
    taxable_amount = sum(item.unit_price * item.quantity for item in quotation.items if item.is_taxable)
    total_tax = taxable_amount * (quotation.tax_percentage / 100)
    total = subtotal + total_tax + quotation.other_charges

    # 2. Get next quotation number for the account
    next_quotation_number = _get_next_quotation_number(db, account_id)

    # 3. Create the main Quotation record
    db_quotation = models.Quotation(
        quotation_number=next_quotation_number,
        client_id=quotation.client_id,
        user_id=user_id,
        account_id=account_id,
        created_date=datetime.datetime.now(datetime.timezone.utc),
        valid_until_date=quotation.valid_until_date,
        subtotal=subtotal,
        tax_percentage=quotation.tax_percentage,
        total_tax=total_tax,
        other_charges=quotation.other_charges,
        total=total,
        status=quotation.status
    )
    db.add(db_quotation)
    db.commit()
    db.refresh(db_quotation)

    # 4. Create the QuotationItem records
    for item in quotation.items:
        db_item = models.QuotationItem(
            **item.dict(),
            quotation_id=db_quotation.id,
            total=item.unit_price * item.quantity
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_quotation)
    return db_quotation

def delete_quotation(db: Session, quotation_id: int, account_id: int):
    db_quotation = get_quotation(db, quotation_id=quotation_id, account_id=account_id)
    if not db_quotation:
        return None
    
    # Deletion of items is handled by cascade settings in a real app,
    # but manual deletion is safer for now.
    db.query(models.QuotationItem).filter(models.QuotationItem.quotation_id == quotation_id).delete()
    db.delete(db_quotation)
    db.commit()
    return {"message": "Quotation deleted successfully"}

# --- Company Profile Functions (Could be adapted for multi-tenancy) ---
# These currently affect a single global profile.

def get_company_profile(db: Session):
    profile = db.query(models.CompanyProfile).first()
    if not profile:
        # If no profile exists, create a default one
        default_profile = models.CompanyProfile(
            company_name="",
            address="",
            phone="",
            website="",
            logo_path=""
        )
        db.add(default_profile)
        db.commit()
        db.refresh(default_profile)
        return default_profile
    return profile

def update_company_profile(db: Session, profile_in: schemas.CompanyProfileCreate):
    profile = db.query(models.CompanyProfile).first()
    if profile:
        profile_data = profile_in.dict()
        for key, value in profile_data.items():
            setattr(profile, key, value)
        db.commit()
        db.refresh(profile)
    return profile

def update_logo_path(db: Session, logo_path: str):
    profile = db.query(models.CompanyProfile).first()
    if profile:
        profile.logo_path = logo_path
        db.commit()
        db.refresh(profile)
    return profile

# --- Terms and Conditions Functions ---

def get_or_create_terms_conditions(db: Session, account_id: int) -> models.TermsConditions:
    """Gets the terms for an account, creating default ones if they don't exist."""
    terms = db.query(models.TermsConditions).filter(models.TermsConditions.account_id == account_id).first()
    if not terms:
        default_content = (
            "1. Al cliente se le cobrará 70 % después de aceptada esta cotización.\n"
            "2. El pago será debitado antes de la entrega de bienes y servicios.\n"
            "3. Por favor enviar la cotización firmada al email indicado anteriormente.\n"
            "4. Esta cotización no incluye IVA si requiere Factura Favor de indicar."
        )
        terms = models.TermsConditions(content=default_content, account_id=account_id)
        db.add(terms)
        db.commit()
        db.refresh(terms)
    return terms

def update_terms_conditions(db: Session, account_id: int, terms_in: schemas.TermsConditionsUpdate) -> models.TermsConditions:
    """Updates the terms and conditions for a specific account."""
    db_terms = get_or_create_terms_conditions(db, account_id=account_id)
    update_data = terms_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_terms, key, value)
    db.add(db_terms)
    db.commit()
    db.refresh(db_terms)
    return db_terms
