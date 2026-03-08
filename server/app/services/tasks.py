from sqlalchemy import delete, exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.errors import ForbiddenException, NotFoundException
from app.models import CategoryDB, TaskDB
from app.schemas import TaskCreate, TaskRead
from app.services.categories import fetch_category


def _get_or_create_default_category(db: Session, user_id: int) -> CategoryDB:
    category_db = db.scalar(
        select(CategoryDB).where(CategoryDB.user_id == user_id).order_by(CategoryDB.id)
    )
    if category_db:
        return category_db

    category_db = CategoryDB(name="Inbox", user_id=user_id)
    db.add(category_db)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        category_db = db.scalar(
            select(CategoryDB).where(
                CategoryDB.user_id == user_id, CategoryDB.name == "Inbox"
            )
        )
        if not category_db:
            raise
    db.refresh(category_db)
    return category_db


def _fetch_task_db(db: Session, task_id: int, user_id: int) -> TaskDB:
    if not (task_db := db.get(TaskDB, task_id)):
        raise NotFoundException("Task not found.")
    task_category = fetch_category(db, task_db.category_id, user_id)
    if user_id != task_category.user_id:
        raise ForbiddenException("You have no right to access this task.")
    return task_db


def fetch_task(db: Session, task_id: int, user_id: int) -> TaskRead:
    return TaskRead.model_validate(_fetch_task_db(db, task_id, user_id))


def list_tasks(db: Session, user_id: int) -> list[TaskRead]:
    stmt = (
        select(TaskDB)
        .join(CategoryDB, CategoryDB.id == TaskDB.category_id)
        .where(CategoryDB.user_id == user_id)
        .order_by(TaskDB.id)
    )
    return [TaskRead.model_validate(t) for t in db.scalars(stmt).all()]


def create_task(db: Session, task: TaskCreate, user_id: int) -> TaskRead:
    if task.category_id is not None:
        category_db = fetch_category(db, task.category_id, user_id)
    else:
        category_db = _get_or_create_default_category(db, user_id=user_id)
    task_db = TaskDB(name=task.name, is_done=task.is_done, category_id=category_db.id)
    db.add(task_db)
    db.commit()
    db.refresh(task_db)
    return TaskRead.model_validate(task_db)


def delete_task(db: Session, task_id: int, user_id: int) -> None:
    task_db: TaskDB = _fetch_task_db(db, task_id, user_id)
    db.delete(task_db)
    db.commit()


def delete_all_done(db: Session, user_id: int) -> None:
    stmt = delete(TaskDB).where(
        TaskDB.is_done.is_(True),
        exists(
            select(1)
            .where(CategoryDB.id == TaskDB.category_id)
            .where(CategoryDB.user_id == user_id)
        ),
    )
    db.execute(stmt)
    db.commit()


def delete_category_done(db: Session, category_id: int, user_id: int):
    fetch_category(db, category_id, user_id)  # checking if the category belongs to user
    stmt = delete(TaskDB).where(
        TaskDB.is_done.is_(True),
        TaskDB.category_id == category_id,
    )
    db.execute(stmt)
    db.commit()


def change_done(db: Session, task_id: int, is_done: bool, user_id: int) -> TaskRead:
    task_db: TaskDB = _fetch_task_db(db, task_id=task_id, user_id=user_id)
    task_db.is_done = is_done
    db.commit()
    db.refresh(task_db)
    return TaskRead.model_validate(task_db)


def change_name(db: Session, task_id: int, name: str, user_id: int) -> TaskRead:
    task_db: TaskDB = _fetch_task_db(db, task_id, user_id)
    task_db.name = name
    db.commit()
    db.refresh(task_db)
    return TaskRead.model_validate(task_db)


def update_task(task: TaskRead, db: Session, user_id: int) -> TaskRead:
    task_db: TaskDB = _fetch_task_db(db, task.id, user_id)  # existing row

    if task.category_id != task_db.category_id:
        fetch_category(db, task.category_id, user_id)

    for field, value in task.model_dump().items():
        if field == "id":
            continue
        setattr(task_db, field, value)

    db.commit()
    db.refresh(task_db)
    return TaskRead.model_validate(task_db)
