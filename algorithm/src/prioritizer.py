# prioritizer.py
# Calculates a priority score for each task.
#
# Score is based on two factors:
#   1. Deadline urgency  — tasks due sooner score higher
#   2. Difficulty weight — harder tasks score higher (need more early attention)
#
# Formula:
#   urgency_score   = 100 / max(days_until_deadline, 1)
#   difficulty_score = { easy: 1, medium: 2, hard: 3 }
#   final_score     = (urgency_score * 0.7) + (difficulty_score * 10 * 0.3)
#
# The 0.7 / 0.3 weights mean deadline urgency matters more than difficulty.

from datetime import date

DIFFICULTY_WEIGHTS = {
    'easy':   1,
    'medium': 2,
    'hard':   3
}

def calculate_priority(task: dict, today: date = None) -> float:
    """
    Calculate the priority score for a single task.

    Args:
        task: dict with keys: deadline (str YYYY-MM-DD), difficulty (str),
              estimated_hours (float), completed_hours (float)
        today: reference date (defaults to today). Useful for testing.

    Returns:
        float: priority score (higher = more urgent/important)
    """
    if today is None:
        today = date.today()

    # Parse deadline string to date object
    if isinstance(task['deadline'], str):
        deadline = date.fromisoformat(task['deadline'][:10])
    else:
        deadline = task['deadline']

    # Days remaining — minimum 1 to avoid division by zero
    days_left = max((deadline - today).days, 1)

    # Urgency: inversely proportional to days left
    urgency_score = 100 / days_left

    # Difficulty weight
    difficulty = task.get('difficulty', 'medium').lower()
    difficulty_score = DIFFICULTY_WEIGHTS.get(difficulty, 2) * 10

    # Remaining work ratio — tasks closer to completion score slightly lower
    estimated = float(task.get('estimated_hours', 1))
    completed = float(task.get('completed_hours', 0))
    remaining_ratio = max((estimated - completed) / max(estimated, 1), 0)

    # Combine all factors
    score = (urgency_score * 0.7) + (difficulty_score * 0.3) * remaining_ratio

    return round(score, 2)


def prioritize_tasks(tasks: list, today: date = None) -> list:
    """
    Score and sort a list of tasks by priority (highest first).

    Args:
        tasks: list of task dicts
        today: reference date (defaults to today)

    Returns:
        list of tasks with added 'priority_score' field, sorted highest first
    """
    if not tasks:
        return []

    scored = []
    for task in tasks:
        score = calculate_priority(task, today)
        scored.append({ **task, 'priority_score': score })

    # Sort by priority score descending
    scored.sort(key=lambda t: t['priority_score'], reverse=True)

    return scored