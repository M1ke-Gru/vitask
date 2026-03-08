from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.errors import ForbiddenException, NotFoundException
from app.models import CategoryDB, TaskDB


def list_categories(db: Session, user_id: int) -> list[CategoryDB]:
    stmt = select(CategoryDB).where(CategoryDB.user_id == user_id)
    return list(db.scalars(stmt).all())


def fetch_category(db: Session, category_id: int, user_id: int) -> CategoryDB:
    if not (category_db := db.get(CategoryDB, category_id)):
        raise NotFoundException("Category not found.")
    if category_db.user_id != user_id:
        raise ForbiddenException("The user cannot access this category.")
    return category_db


def create_category(db: Session, *, category_name: str, user_id: int) -> CategoryDB:
    category_db = CategoryDB(name=category_name, user_id=user_id)
    db.add(category_db)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise ValueError(str(e.orig)) from e
    db.refresh(category_db)
    fetch_category(db, category_db.id, user_id)
    return category_db


def delete_category(db: Session, category_id: int, user_id: int) -> None:
    category_db: CategoryDB = fetch_category(db, category_id, user_id)
    db.delete(category_db)
    db.commit()


def change_category_name(
    db: Session, category_name: str, category_id: int, user_id: int
) -> CategoryDB:
    category_db: CategoryDB = fetch_category(db, category_id, user_id)
    category_db.name = category_name
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise ValueError(str(e.orig)) from e
    db.refresh(category_db)
    return category_db


def list_category_tasks(db: Session, category_id: int, user_id: int) -> list[TaskDB]:
    category_db: CategoryDB = fetch_category(db, category_id, user_id)
    stmt = select(TaskDB).where(TaskDB.category_id == category_db.id)
    return list(db.scalars(stmt).all())
