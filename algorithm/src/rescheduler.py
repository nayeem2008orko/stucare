# rescheduler.py
# Handles missed tasks — tasks that were scheduled but not completed.
#
# Logic:
#   1. Identify missed tasks (status == 'missed' or plan item skipped)
#   2. Check if deadline has already passed → mark as overdue
#   3. If deadline still ahead → redistribute remaining hours across remaining days
#   4. Return updated task list with adjusted estimated_hours per day

from datetime import date, timedelta


def reschedule_missed(tasks: list, today: date = None) -> list:
    """
    Process missed tasks and calculate adjusted daily hour targets.

    Args:
        tasks: list of task dicts. Each should have:
               - deadline (str YYYY-MM-DD)
               - estimated_hours (float)
               - completed_hours (float)
               - status (str)
               - id, title, subject, difficulty

        today: reference date (defaults to today)

    Returns:
        list of task dicts with added fields:
          - days_remaining (int)
          - hours_remaining (float)
          - suggested_hours_per_day (float)
          - is_overdue (bool)
          - reschedule_status (str): 'on_track' | 'needs_attention' | 'overdue'
    """
    if today is None:
        today = date.today()

    rescheduled = []

    for task in tasks:
        # Parse deadline
        if isinstance(task['deadline'], str):
            deadline = date.fromisoformat(task['deadline'][:10])
        else:
            deadline = task['deadline']

        estimated  = float(task.get('estimated_hours', 1))
        completed  = float(task.get('completed_hours', 0))
        remaining  = max(estimated - completed, 0)
        days_left  = (deadline - today).days
        is_overdue = days_left < 0

        # Calculate suggested hours per day
        if is_overdue or days_left == 0:
            # No time left — needs immediate attention today
            suggested_per_day   = remaining
            reschedule_status   = 'overdue'
        elif remaining == 0:
            suggested_per_day   = 0
            reschedule_status   = 'on_track'
        else:
            suggested_per_day = round(remaining / days_left, 2)

            # Flag tasks needing more than 4 hours/day as needing attention
            if suggested_per_day > 4:
                reschedule_status = 'needs_attention'
            else:
                reschedule_status = 'on_track'

        rescheduled.append({
            **task,
            'days_remaining':          days_left,
            'hours_remaining':         round(remaining, 2),
            'suggested_hours_per_day': suggested_per_day,
            'is_overdue':              is_overdue,
            'reschedule_status':       reschedule_status,
            'deadline':                deadline.isoformat()
                                       if not isinstance(task['deadline'], str)
                                       else task['deadline']
        })

    return rescheduled
