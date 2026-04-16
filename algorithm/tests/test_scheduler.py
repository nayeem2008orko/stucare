# test_scheduler.py
from datetime import date, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'))

from scheduler import allocate_time, MIN_SESSION_MIN, MAX_SESSION_MIN

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_task(id, days=5, difficulty='medium', estimated=5, completed=0):
    return {
        'id':              id,
        'title':           f'Task {id}',
        'subject':         'Science',
        'deadline':        (date.today() + timedelta(days=days)).isoformat(),
        'difficulty':      difficulty,
        'estimated_hours': estimated,
        'completed_hours': completed
    }

# ── Tests ─────────────────────────────────────────────────────────────────────

def test_returns_schedule_list():
    tasks = [make_task('t1'), make_task('t2')]
    result = allocate_time(tasks, available_hours=4)
    assert isinstance(result, list)

def test_empty_tasks_returns_empty():
    assert allocate_time([], available_hours=4) == []

def test_zero_hours_returns_empty():
    tasks = [make_task('t1')]
    assert allocate_time(tasks, available_hours=0) == []

def test_session_duration_within_bounds():
    tasks = [make_task(f't{i}') for i in range(5)]
    result = allocate_time(tasks, available_hours=6)
    for item in result:
        assert item['duration_min'] >= MIN_SESSION_MIN
        assert item['duration_min'] <= MAX_SESSION_MIN

def test_schedule_has_required_fields():
    tasks = [make_task('t1')]
    result = allocate_time(tasks, available_hours=3)
    if result:
        item = result[0]
        for field in ['task_id', 'title', 'duration_min', 'start_time', 'end_time', 'priority_score']:
            assert field in item, f"Missing field: {field}"

def test_completed_task_not_scheduled():
    # A task that is already 100% complete should not appear
    tasks = [make_task('done', estimated=5, completed=5)]
    result = allocate_time(tasks, available_hours=4)
    assert result == []

def test_start_time_format():
    tasks = [make_task('t1')]
    result = allocate_time(tasks, available_hours=2)
    if result:
        # Should be in HH:MM format
        time_str = result[0]['start_time']
        assert len(time_str) == 5
        assert time_str[2] == ':'
        