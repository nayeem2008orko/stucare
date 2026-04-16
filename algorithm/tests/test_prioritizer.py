# test_prioritizer.py
from datetime import date, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'))

from prioritizer import calculate_priority, prioritize_tasks
# ── Helpers ───────────────────────────────────────────────────────────────────

def make_task(days_until_deadline, difficulty='medium',
              estimated_hours=5, completed_hours=0, id='task-1'):
    deadline = date.today() + timedelta(days=days_until_deadline)
    return {
        'id':               id,
        'title':            f'Task due in {days_until_deadline} days',
        'subject':          'Math',
        'deadline':         deadline.isoformat(),
        'difficulty':       difficulty,
        'estimated_hours':  estimated_hours,
        'completed_hours':  completed_hours
    }

# ── calculate_priority tests ──────────────────────────────────────────────────

def test_closer_deadline_scores_higher():
    urgent = make_task(days_until_deadline=2)
    relaxed = make_task(days_until_deadline=20)
    assert calculate_priority(urgent) > calculate_priority(relaxed)

def test_harder_task_scores_higher_same_deadline():
    hard = make_task(days_until_deadline=5, difficulty='hard')
    easy = make_task(days_until_deadline=5, difficulty='easy')
    assert calculate_priority(hard) > calculate_priority(easy)

def test_completed_task_scores_lower():
    incomplete = make_task(days_until_deadline=5, estimated_hours=10, completed_hours=0)
    almost_done = make_task(days_until_deadline=5, estimated_hours=10, completed_hours=9)
    assert calculate_priority(incomplete) > calculate_priority(almost_done)

def test_deadline_today_scores_very_high():
    score = calculate_priority(make_task(days_until_deadline=0))
    assert score >= 70   # urgency_score = 100/1 * 0.7 = 70 minimum

def test_score_is_positive():
    score = calculate_priority(make_task(days_until_deadline=30))
    assert score > 0

# ── prioritize_tasks tests ────────────────────────────────────────────────────

def test_prioritize_returns_sorted_list():
    tasks = [
        make_task(20, 'easy',   id='task-a'),
        make_task(2,  'hard',   id='task-b'),
        make_task(10, 'medium', id='task-c'),
    ]
    result = prioritize_tasks(tasks)
    scores = [t['priority_score'] for t in result]
    assert scores == sorted(scores, reverse=True)

def test_prioritize_empty_list():
    assert prioritize_tasks([]) == []

def test_prioritize_adds_score_field():
    tasks = [make_task(5)]
    result = prioritize_tasks(tasks)
    assert 'priority_score' in result[0]