# scheduler.py
# Allocates time slots for today's study session.
#
# Logic:
#   1. Receive prioritized tasks (already sorted by priority)
#   2. Respect the student's available study hours for the day
#   3. Split time proportionally — higher priority tasks get more time
#   4. Add short breaks between sessions
#   5. Return a list of time-slotted schedule items
#
# Constraints:
#   - Minimum session: 25 minutes (Pomodoro principle)
#   - Maximum session: 90 minutes (cognitive limit)
#   - Break between sessions: 10 minutes
#   - Only schedule tasks that still have remaining work

from datetime import datetime, timedelta
from prioritizer import prioritize_tasks

MIN_SESSION_MIN = 25    # minimum study block in minutes
MAX_SESSION_MIN = 90    # maximum study block in minutes
BREAK_MIN       = 10    # break between sessions in minutes
START_HOUR      = 9     # default study day starts at 9:00 AM


def allocate_time(tasks: list, available_hours: float, today=None) -> list:
    """
    Generate a time-slotted study schedule for today.

    Args:
        tasks: list of task dicts (will be prioritized internally)
        available_hours: how many hours the student can study today
        today: reference date string YYYY-MM-DD (defaults to today)

    Returns:
        list of schedule items with start/end times
    """
    if not tasks or available_hours <= 0:
        return []

    # Step 1 — Prioritize tasks
    prioritized = prioritize_tasks(tasks, today)

    # Filter out tasks with no remaining work
    pending = [
        t for t in prioritized
        if float(t.get('estimated_hours', 0)) > float(t.get('completed_hours', 0))
    ]

    if not pending:
        return []

    # Step 2 — Calculate total available minutes
    total_minutes = int(available_hours * 60)

    # Step 3 — Proportional time allocation based on priority score
    total_score = sum(t['priority_score'] for t in pending)
    allocations = []

    for task in pending:
        if total_score == 0:
            raw_min = total_minutes / len(pending)
        else:
            proportion = task['priority_score'] / total_score
            raw_min = proportion * total_minutes

        # Clamp between min and max session length
        clamped_min = max(MIN_SESSION_MIN, min(MAX_SESSION_MIN, int(raw_min)))

        # Also don't schedule more than remaining work requires
        remaining_hours = float(task['estimated_hours']) - float(task.get('completed_hours', 0))
        max_needed_min  = int(remaining_hours * 60)
        final_min       = min(clamped_min, max_needed_min)

        if final_min >= MIN_SESSION_MIN:
            allocations.append({
                'task': task,
                'duration_min': final_min
            })

    # Step 4 — Assign actual clock times
    schedule = []
    current_time = datetime.strptime(f"{START_HOUR:02d}:00", "%H:%M")
    remaining_budget = total_minutes

    for item in allocations:
        if remaining_budget <= 0:
            break

        duration = min(item['duration_min'], remaining_budget)
        if duration < MIN_SESSION_MIN:
            break

        end_time = current_time + timedelta(minutes=duration)
        task     = item['task']

        schedule.append({
            'task_id':        task.get('id'),
            'title':          task.get('title'),
            'subject':        task.get('subject'),
            'difficulty':     task.get('difficulty'),
            'deadline':       task.get('deadline') if isinstance(task.get('deadline'), str)
                              else task.get('deadline').isoformat(),
            'priority_score': task.get('priority_score'),
            'duration_min':   duration,
            'start_time':     current_time.strftime("%H:%M"),
            'end_time':       end_time.strftime("%H:%M")
        })

        # Move clock forward: session duration + break
        current_time   = end_time + timedelta(minutes=BREAK_MIN)
        remaining_budget -= (duration + BREAK_MIN)

    return schedule