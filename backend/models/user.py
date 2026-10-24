from pydantic import BaseModel, EmailStr, Field
from typing import Literal

# -------------------- Base --------------------
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: Literal["student", "mentor", "manager", "admin"] = "student"
    # 👆 explicit roles → safer than regex

# -------------------- Create --------------------
class UserCreate(UserBase):
    password: str

# -------------------- Output --------------------
class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: Literal["student", "mentor", "manager", "admin"]

# -------------------- Login --------------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str
