from pydantic import BaseModel, Field, EmailStr, ConfigDict


class UserBase(BaseModel):
    username: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserRead(UserBase):
    id: int


class CategoryCreate(BaseModel):
    name: str

    model_config = ConfigDict(from_attributes=True)


class CategoryRead(CategoryCreate):
    id: int


class TaskCreate(BaseModel):
    name: str
    is_done: bool = Field(alias="isDone")
    category_id: int | None = Field(None, alias="categoryId")

    model_config = ConfigDict(validate_by_name=True, from_attributes=True)


class TaskRead(TaskCreate):
    id: int
    category_id: int = Field(alias="categoryId")
