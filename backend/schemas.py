from pydantic import BaseModel, validator
from typing import List, Optional
import datetime

# --- Base Schemas ---

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

class ClientBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class QuotationItemBase(BaseModel):
    product_id: int
    description: str
    unit_price: float
    quantity: int
    is_taxable: bool = True

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None

class QuotationBase(BaseModel):
    client_id: int
    user_id: int
    validity_days: int = 30
    tax_percentage: float = 16.0
    other_charges: float = 0.0
    status: str = 'draft'
    payment_status: Optional[str] = 'no_pagada'

class CompanyProfileBase(BaseModel):
    company_name: str
    address: str
    phone: str
    website: str
    footer_text: Optional[str] = "Si usted tiene alguna pregunta sobre esta cotización, por favor, póngase en contacto con nosotros"
    footer_thanks: Optional[str] = "¡Gracias por hacer negocios con nosotros!"

class TermsConditionsBase(BaseModel):
    content: str

# --- Create Schemas ---

class ProductCreate(ProductBase):
    pass

class ClientCreate(ClientBase):
    pass

class QuotationItemCreate(QuotationItemBase):
    pass

class UserCreate(UserBase):
    pass

class QuotationCreate(QuotationBase):
    items: List[QuotationItemCreate]

class CompanyProfileCreate(CompanyProfileBase):
    pass

class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    footer_text: Optional[str] = None
    footer_thanks: Optional[str] = None

class TermsConditionsCreate(TermsConditionsBase):
    pass

# --- Update Schemas ---

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class QuotationUpdate(BaseModel):
    client_id: Optional[int] = None
    user_id: Optional[int] = None
    validity_days: Optional[int] = None
    tax_percentage: Optional[float] = None
    other_charges: Optional[float] = None
    status: Optional[str] = None
    payment_status: Optional[str] = None
    items: Optional[List[QuotationItemCreate]] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class TermsConditionsUpdate(TermsConditionsBase):
    pass

# --- Full Model Schemas (for reading) ---

class Product(ProductBase):
    id: int
    account_id: int

    class Config:
        from_attributes = True

class Client(ClientBase):
    id: int
    client_id_number: Optional[str] = None
    account_id: int

    class Config:
        from_attributes = True

class QuotationItem(QuotationItemBase):
    id: int
    total: float

    class Config:
        from_attributes = True

class User(UserBase):
    id: int
    is_active: bool
    account_id: int

    class Config:
        from_attributes = True

class Quotation(QuotationBase):
    id: int
    quotation_number: str
    created_date: datetime.datetime
    valid_until_date: datetime.datetime
    subtotal: float
    total_tax: float
    total: float
    account_id: int
    items: List[QuotationItem] = []
    client: Client
    user: User

    class Config:
        from_attributes = True

class CompanyProfile(CompanyProfileBase):
    id: int
    logo_path: Optional[str] = None

    class Config:
        from_attributes = True

class TermsConditions(TermsConditionsBase):
    id: int
    account_id: int

    class Config:
        from_attributes = True

# --- Account Schemas (New) ---

class AccountBase(BaseModel):
    username: str
    full_name: Optional[str] = None

class AccountCreate(AccountBase):
    password: str

class AccountUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

    @validator('password', pre=True, always=True)
    def empty_password_to_none(cls, v):
        """Treat empty string as None so it is excluded from updates."""
        if v == '' or v is None:
            return None
        return v

class AccountDeleteWithPassword(BaseModel):
    password: str

class Account(AccountBase):
    id: int
    role: str
    users: List[User] = []
    clients: List[Client] = []
    products: List[Product] = []

    class Config:
        from_attributes = True

# --- Token Schemas (for authentication) ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# --- App Settings Schemas (Global, not per-account) ---

class AppSettingsBase(BaseModel):
    fondo_login_url: Optional[str] = None
    overlay_opacity: Optional[str] = "0.4"
    logo_app_url: Optional[str] = None

class AppSettingsUpdate(BaseModel):
    fondo_login_url: Optional[str] = None
    overlay_opacity: Optional[str] = None
    logo_app_url: Optional[str] = None

class AppSettings(AppSettingsBase):
    id: int

    class Config:
        from_attributes = True
