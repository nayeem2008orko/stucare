# app.py
import os
import sys

# This must come BEFORE any src imports
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

from prioritizer import prioritize_tasks
from scheduler   import allocate_time
from rescheduler import reschedule_missed

app = Flask(__name__)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'service': 'stucare-algorithm' })


@app.route('/prioritize', methods=['POST'])
def prioritize():
    data  = request.get_json()
    tasks = data.get('tasks', [])
    if not tasks:
        return jsonify({ 'error': 'No tasks provided' }), 400
    result = prioritize_tasks(tasks)
    return jsonify({ 'tasks': result })


@app.route('/schedule', methods=['POST'])
def schedule():
    data            = request.get_json()
    tasks           = data.get('tasks', [])
    available_hours = float(data.get('available_hours', 4))
    if not tasks:
        return jsonify({ 'error': 'No tasks provided' }), 400
    if available_hours <= 0:
        return jsonify({ 'error': 'available_hours must be greater than 0' }), 400
    result = allocate_time(tasks, available_hours)
    return jsonify({ 'schedule': result })


@app.route('/reschedule', methods=['POST'])
def reschedule():
    data  = request.get_json()
    tasks = data.get('tasks', [])
    if not tasks:
        return jsonify({ 'error': 'No tasks provided' }), 400
    result = reschedule_missed(tasks)
    return jsonify({ 'tasks': result })


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    print(f'Algorithm service running on port {port}')
    app.run(host='0.0.0.0', port=port, debug=os.getenv('NODE_ENV') != 'production')