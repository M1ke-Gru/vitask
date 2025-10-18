from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.errors import ForbiddenException, NotFoundException
from app.models import TaskDB


def list_tasks(db: Session, user_id: int) -> list[TaskDB]:
    stmt = select(TaskDB).where(TaskDB.user_id == user_id)
    print( [(t.name, t.is_done) for t in list(db.scalars(stmt).all())])
    return list(db.scalars(stmt).all())


def fetch_task(db: Session, task_id: int, user_id: int) -> TaskDB:
    if not (task_db := db.get(TaskDB, task_id)):
        raise NotFoundException("Task not found.")
    if task_db.user_id != user_id:
        raise ForbiddenException("The user cannot access this task.")
    return task_db


def create_task(db: Session, *, task_name: str, is_done: bool, user_id: int) -> TaskDB:
    task_db = TaskDB(name=task_name, is_done=is_done, user_id=user_id)
    if not task_db:
        raise Exception(f"Task with name {task_name} not created.")
    db.add(task_db)
    db.commit()
    db.refresh(task_db)
    if not fetch_task(db, task_db.id, user_id):
        raise NotFoundException("Task not created.")
    return task_db


def delete_task(db: Session, task_id: int, user_id: int) -> None:
    task_db: TaskDB = fetch_task(db, task_id, user_id)
    db.delete(task_db)
    db.commit()


def delete_done(db: Session, user_id: int) -> None:
    stmt = delete(TaskDB).where((TaskDB.user_id == user_id) & (TaskDB.is_done == True))
    db.execute(stmt)
    db.commit()


def change_done(db: Session, task_id: int, is_done: bool, user_id: int) -> None:
    task_db: TaskDB = fetch_task(db, task_id=task_id, user_id=user_id)
    task_db.is_done = is_done
    db.commit()
    db.refresh(task_db)
    print(task_db)


def change_name(db: Session, task_id: int, name: str, user_id: int) -> None:
    task_db: TaskDB = fetch_task(db, task_id, user_id)
    task_db.name = name
    db.commit()
