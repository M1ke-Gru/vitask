from pydantic import BaseModel, Field, EmailStr, ConfigDict


class UserBase(BaseModel):
    username: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserRead(UserBase):
    id: int


class TaskCreate(BaseModel):
    name: str
    is_done: bool = False

    model_config = ConfigDict(from_attributes=True)


class TaskRead(TaskCreate):
    id: int
    user_id: int
