from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ForbiddenException, NotFoundException
from app.models import UserDB

from ..auth import get_current_active_user
from ..schemas import CategoryCreate, CategoryRead, TaskRead
from ..services import categories as category_svc

category_router = APIRouter(prefix="/category", tags=["categories"])


@category_router.get("/list", response_model=list[CategoryRead])
def list_categories(
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    return [
        CategoryRead.model_validate(c)
        for c in category_svc.list_categories(db, user.id)
    ]


@category_router.post("/create", status_code=201, response_model=CategoryRead)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        created = category_svc.create_category(
            db,
            category_name=category.name,
            user_id=user.id,
        )
    except Exception as e:
        raise HTTPException(400, str(e))
    return CategoryRead.model_validate(created)


@category_router.patch("/name/{category_id}/{name}", response_model=CategoryRead)
def change_category_name(
    category_id: int,
    name: str,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        updated = category_svc.change_category_name(
            db,
            category_name=name,
            category_id=category_id,
            user_id=user.id,
        )
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))
    return CategoryRead.model_validate(updated)


@category_router.delete("/delete/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        category_svc.delete_category(db, category_id, user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))


@category_router.get("/tasks/{category_id}", response_model=list[TaskRead])
def list_category_tasks(
    category_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        tasks = category_svc.list_category_tasks(db, category_id, user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))
    return [TaskRead.model_validate(t) for t in tasks]


# Put only after all of the other getters for /category
@category_router.get("/{category_id}", response_model=CategoryRead)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        category_db = category_svc.fetch_category(db, category_id, user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))
    return CategoryRead.model_validate(category_db)
