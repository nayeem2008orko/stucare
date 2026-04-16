# conftest.py
# Tells pytest to add src/ to the Python path automatically
# This fixes all import errors when running pytest from the algorithm/ folder

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))