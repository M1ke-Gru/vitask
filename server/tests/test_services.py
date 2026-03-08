from sqlalchemy.orm import Session

from app.schemas import TaskCreate, TaskRead, UserCreate, UserRead
from app.services import tasks as task_svc
from app.services import users as user_svc


def test_create_user_returns_userread(db_session: Session):
    user_in = UserCreate(
        username="user_a",
        email="user_a@example.com",
        password="P@SSWORD123",
    )
    created = user_svc.create_user(db_session, user_in)
    assert isinstance(created, UserRead)
    assert created.username == "user_a"
    assert created.email == "user_a@example.com"
    assert isinstance(created.id, int)


def test_task_services_return_pydantic_models(db_session: Session):
    user_in = UserCreate(
        username="user_b",
        email="user_b@example.com",
        password="P@SSWORD123",
    )
    user = user_svc.create_user(db_session, user_in)

    created = task_svc.create_task(
        db_session,
        TaskCreate(name="Code", isDone=False),
        user_id=user.id,
    )
    assert isinstance(created, TaskRead)
    assert created.name == "Code"
    assert created.is_done is False

    fetched = task_svc.fetch_task(db_session, created.id, user.id)
    assert isinstance(fetched, TaskRead)
    assert fetched.id == created.id

    changed = task_svc.change_done(db_session, created.id, True, user.id)
    assert isinstance(changed, TaskRead)
    assert changed.is_done is True

    renamed = task_svc.change_name(db_session, created.id, "Renamed", user.id)
    assert isinstance(renamed, TaskRead)
    assert renamed.name == "Renamed"

    updated = task_svc.update_task(
        TaskRead(id=created.id, name="Updated", isDone=True, category_id=created.category_id),
        db_session,
        user.id,
    )
    assert isinstance(updated, TaskRead)
    assert updated.name == "Updated"
    assert updated.is_done is True
