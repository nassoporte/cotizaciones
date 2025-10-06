from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, UniqueConstraint, Text
from sqlalchemy.orm import relationship
import datetime

from database import Base

# The Account model represents the primary user/business owner (Titular).
# This is the user that will log in and own all the data.
class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="user") # e.g., 'admin', 'user'

    # Relationships: An account owns users (advisors), clients, products, and quotations.
    users = relationship("User", back_populates="account", cascade="all, delete-orphan")
    clients = relationship("Client", back_populates="account", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="account", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="account", cascade="all, delete-orphan")
    terms_conditions = relationship("TermsConditions", back_populates="account", uselist=False, cascade="all, delete-orphan")

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, default="Multiserv Galag")
    address = Column(String, default="Calle xxxx, Gomez Palacio, Dgo")
    phone = Column(String, default="[871]-1882233")
    website = Column(String, default="FB Multiserv Galag")
    logo_path = Column(String, nullable=True)
    # In a multi-tenant setup, this could also be linked to an Account
    # account_id = Column(Integer, ForeignKey("accounts.id"))
    # account = relationship("Account")

# The User model now represents a Sales Advisor (Asesor) belonging to an Account.
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True) # Asesor's phone
    hashed_password = Column(String) # Password for the advisor, if they get login rights in the future.
    is_active = Column(Boolean, default=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"))

    account = relationship("Account", back_populates="users")

# A Client belongs to an Account.
class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    client_id_number = Column(String, nullable=True) # CLIENTE ID
    name = Column(String, index=True)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"))

    account = relationship("Account", back_populates="clients")

# A Product belongs to an Account.
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    price = Column(Float)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"))

    account = relationship("Account", back_populates="products")

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quotation_number = Column(String, index=True) # No longer globally unique
    client_id = Column(Integer, ForeignKey("clients.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # The advisor who created it
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE")) # The account it belongs to
    created_date = Column(DateTime, default=datetime.datetime.utcnow)
    valid_until_date = Column(DateTime)
    subtotal = Column(Float)
    tax_percentage = Column(Float)
    total_tax = Column(Float)
    other_charges = Column(Float, default=0)
    total = Column(Float)
    status = Column(String, default="draft") # e.g., draft, sent, accepted, rejected

    client = relationship("Client")
    user = relationship("User")
    account = relationship("Account", back_populates="quotations")
    items = relationship("QuotationItem", back_populates="quotation")

    __table_args__ = (UniqueConstraint('account_id', 'quotation_number', name='_account_quotation_uc'),)

class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    description = Column(String)
    unit_price = Column(Float)
    quantity = Column(Integer)
    is_taxable = Column(Boolean, default=True)
    total = Column(Float)

    quotation = relationship("Quotation", back_populates="items")
    product = relationship("Product")

class TermsConditions(Base):
    __tablename__ = "terms_conditions"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), unique=True)

    account = relationship("Account", back_populates="terms_conditions")