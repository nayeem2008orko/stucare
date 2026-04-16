# test_rescheduler.py
from datetime import date, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'))

from rescheduler import reschedule_missed

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_task(id, days_left, estimated=6, completed=2):
    deadline = date.today() + timedelta(days=days_left)
    return {
        'id':              id,
        'title':           f'Task {id}',
        'subject':         'History',
        'difficulty':      'medium',
        'deadline':        deadline.isoformat(),
        'estimated_hours': estimated,
        'completed_hours': completed,
        'status':          'in_progress'
    }

# ── Tests ─────────────────────────────────────────────────────────────────────

def test_overdue_task_flagged():
    tasks = [make_task('t1', days_left=-1)]
    result = reschedule_missed(tasks)
    assert result[0]['is_overdue'] is True
    assert result[0]['reschedule_status'] == 'overdue'

def test_on_track_task():
    # 10 days left, 4 hours remaining → 0.4 hrs/day, well within limit
    tasks = [make_task('t1', days_left=10, estimated=6, completed=2)]
    result = reschedule_missed(tasks)
    assert result[0]['reschedule_status'] == 'on_track'
    assert result[0]['is_overdue'] is False

def test_needs_attention_flag():
    # 1 day left, 10 hours remaining → 10 hrs/day → needs attention
    tasks = [make_task('t1', days_left=1, estimated=12, completed=2)]
    result = reschedule_missed(tasks)
    assert result[0]['reschedule_status'] == 'needs_attention'

def test_completed_task_on_track():
    tasks = [make_task('t1', days_left=5, estimated=5, completed=5)]
    result = reschedule_missed(tasks)
    assert result[0]['hours_remaining'] == 0
    assert result[0]['suggested_hours_per_day'] == 0
    assert result[0]['reschedule_status'] == 'on_track'

def test_empty_list():
    assert reschedule_missed([]) == []

def test_days_remaining_correct():
    tasks = [make_task('t1', days_left=7)]
    result = reschedule_missed(tasks)
    assert result[0]['days_remaining'] == 7

def test_suggested_hours_per_day_calculation():
    # 4 hours remaining, 2 days left → 2.0 hrs/day
    tasks = [make_task('t1', days_left=2, estimated=6, completed=2)]
    result = reschedule_missed(tasks)
    assert result[0]['suggested_hours_per_day'] == 2.0
    