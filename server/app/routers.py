from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ForbiddenException, NotFoundException
from app.models import TaskDB, UserDB

from .services import tasks as svc
from .auth import get_current_active_user
from .schemas import TaskCreate, TaskRead, UserBase

# TODO: get pydantic out of the service layer.

user_router = APIRouter(prefix="/user", tags=["user"])
task_router = APIRouter(prefix="/task", tags=["tasks"])


@user_router.get("", response_model=UserBase)
def read_me(user=Depends(get_current_active_user)):
    if not user:
        raise HTTPException(400, "User is not logged in.")
    return UserBase.model_validate(user)


@user_router.get("/username")
def get_username(user=Depends(get_current_active_user)):
    if not user:
        raise HTTPException(400, "User is not logged in.")
    return user.username


@task_router.get("/list")
def list_tasks_router(
    db: Session = Depends(get_db), user: UserDB = Depends(get_current_active_user)
):
    print("DEBUG: creating for user_id", user.id)
    tasks: list[TaskRead] = [
        TaskRead.model_validate(task) for task in svc.list_tasks(db, user.id)
    ]
    return tasks


# Put only after all of the other getters for /task
@task_router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: int, user=Depends(get_current_active_user), db: Session = Depends(get_db)
):
    try:
        task = TaskRead.model_validate(svc.fetch_task(db, task_id, user.id))
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))
    except Exception as e:
        raise e
    return task


@task_router.post("/create", status_code=201, response_model=TaskRead)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    print("DEBUG: creating for user_id", user.id)
    try:
        task_db: TaskDB = svc.create_task(
            db, task_name=task.name, is_done=task.is_done, user_id=user.id
        )
    except Exception as e:
        raise HTTPException(400, str(e))
    return TaskRead.model_validate(task_db)


@task_router.delete("/delete/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        svc.delete_task(db, task_id, user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))
    except Exception as e:
        raise e


@task_router.patch("/is_done/{task_id}/{is_done}")
def change_done(
    task_id: int,
    is_done: bool,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        svc.change_done(db, task_id, is_done, user_id=user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))
    except Exception as e:
        raise e


@task_router.patch("/name/{task_id}/{name}")
def change_name(
    task_id: int,
    name: str,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        svc.change_name(db, task_id, name, user_id=user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))
    except Exception as e:
        raise e


@task_router.delete("/done")
def delete_all_done(
    db: Session = Depends(get_db), user: UserDB = Depends(get_current_active_user)
):
    svc.delete_done(db, user_id=user.id)


@task_router.patch("/update")
def task_update(
    task: TaskRead,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    svc.update_task(task, db, user.id)
