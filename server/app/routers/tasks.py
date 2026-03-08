from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ForbiddenException, NotFoundException
from app.models import UserDB

from ..services import tasks as task_svc
from ..services import categories as category_svc
from ..auth import get_current_active_user
from ..schemas import TaskCreate, TaskRead

task_router = APIRouter(prefix="/task", tags=["tasks"])


@task_router.get("/list", response_model=list[TaskRead])
def list_tasks(
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    return task_svc.list_tasks(db, user.id)


@task_router.get("/list_category_tasks/{category_id}", response_model=list[TaskRead])
def list_category_tasks(
    category_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    return [
        TaskRead.model_validate(t)
        for t in category_svc.list_category_tasks(db, category_id, user.id)
    ]


# Put only after all of the other getters for /task
@task_router.get("/{task_id}", response_model=TaskRead)
def get_task(
    task_id: int, user=Depends(get_current_active_user), db: Session = Depends(get_db)
):
    try:
        task = task_svc.fetch_task(db, task_id, user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))
    return task


@task_router.post("/create", status_code=201, response_model=TaskRead)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        created = task_svc.create_task(db, task, user.id)
    except Exception as e:
        raise HTTPException(400, str(e))
    return created


@task_router.delete("/delete/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        task_svc.delete_task(db, task_id, user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))


@task_router.patch("/is_done/{task_id}/{is_done}", response_model=TaskRead)
def change_done(
    task_id: int,
    is_done: bool,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        return task_svc.change_done(db, task_id, is_done, user_id=user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))


@task_router.patch("/name/{task_id}/{name}", response_model=TaskRead)
def change_name(
    task_id: int,
    name: str,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        return task_svc.change_name(db, task_id, name, user_id=user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))


@task_router.delete("/category_done/{category_id}")
def delete_category_done(
    category_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    task_svc.delete_category_done(db, category_id, user.id)


@task_router.delete("/done")
def delete_all_done(
    db: Session = Depends(get_db), user: UserDB = Depends(get_current_active_user)
):
    task_svc.delete_all_done(db, user_id=user.id)


@task_router.patch("/update", response_model=TaskRead)
def task_update(
    task: TaskRead,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_active_user),
):
    try:
        return task_svc.update_task(task, db, user.id)
    except NotFoundException as e:
        raise HTTPException(404, str(e))
    except ForbiddenException as e:
        raise HTTPException(401, str(e))
