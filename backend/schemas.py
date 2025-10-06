from pydantic import BaseModel
from typing import List, Optional
import datetime

# --- Base Schemas ---

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

class ClientBase(BaseModel):
    name: str
    client_id_number: Optional[str] = None
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
    valid_until_date: datetime.date
    tax_percentage: float = 16.0
    other_charges: float = 0.0
    status: str = 'draft'

class CompanyProfileBase(BaseModel):
    company_name: str
    address: str
    phone: str
    website: str

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

class TermsConditionsCreate(TermsConditionsBase):
    pass

class QuotationUpdate(BaseModel):
    status: Optional[str] = None

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
    role: Optional[str] = None

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
