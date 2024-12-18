
from flask import Blueprint, request, jsonify
from ..models import Plan, Project, Idea, Paper, Note
from .. import db
from ..utils.helper import format_response
from datetime import datetime
from config import Config

main_api = Blueprint('api', __name__, url_prefix='/api')

@main_api.route('/plans', methods=['GET'])
def get_plans():
    plans = Plan.query.all()
    plans_list = [
        {
            'id': plan.id,
            'title': plan.title,
            'description': plan.description,
            'date': plan.date.strftime('%Y-%m-%d'),
            'time': plan.time.strftime('%H:%M')
        }
        for plan in plans
    ]
    return jsonify(format_response(plans_list))

@main_api.route('/plans/<date>', methods=['GET'])
def get_plans_by_date(date):
    try:
        target_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify(format_response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)), 400

    plans = Plan.query.filter_by(date=target_date).order_by(Plan.time).all()
    plans_list = [
        {
            'id': plan.id,
            'title': plan.title,
            'description': plan.description,
            'time': plan.time.strftime('%H:%M')
        }
        for plan in plans
    ]
    return jsonify(format_response(plans_list))

@main_api.route('/plans', methods=['POST'])
def add_plan():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    date_str = data.get('date')
    time_str = data.get('time')

    if not title or not date_str or not time_str:
        return jsonify(format_response({'error': 'Title, date, and time are required'}, status=400)), 400

    try:
        plan_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        plan_time = datetime.strptime(time_str, '%H:%M').time()
    except ValueError:
        return jsonify(format_response({'error': 'Invalid date or time format.'}, status=400)), 400

    new_plan = Plan(title=title, description=description, date=plan_date, time=plan_time)
    db.session.add(new_plan)
    db.session.commit()
    return jsonify(format_response({'message': 'Plan added successfully'})), 201

@main_api.route('/projects', methods=['GET'])
def get_projects():
    projects = Project.query.all()
    projects_list = [{'id': project.id, 'name': project.name, 'description': project.description} for project in projects]
    return jsonify(format_response(projects_list))

@main_api.route('/projects', methods=['POST'])
def add_project():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    if not name:
        return jsonify(format_response({'error': 'Name is required'}, status=400)), 400
    new_project = Project(name=name, description=description)
    db.session.add(new_project)
    db.session.commit()
    return jsonify(format_response({'message': 'Project added successfully'})), 201

@main_api.route('/ideas', methods=['GET'])
def get_ideas():
    ideas = Idea.query.all()
    ideas_list = [{'id': idea.id, 'title': idea.title, 'description': idea.description} for idea in ideas]
    return jsonify(format_response(ideas_list))

@main_api.route('/ideas', methods=['POST'])
def add_idea():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    if not title:
        return jsonify(format_response({'error': 'Title is required'}, status=400)), 400
    new_idea = Idea(title=title, description=description)
    db.session.add(new_idea)
    db.session.commit()
    return jsonify(format_response({'message': 'Idea added successfully'})), 201

@main_api.route('/papers', methods=['GET'])
def get_papers():
    papers = Paper.query.all()
    papers_list = [{'id': paper.id, 'title': paper.title, 'abstract': paper.abstract} for paper in papers]
    return jsonify(format_response(papers_list))

@main_api.route('/papers', methods=['POST'])
def add_paper():
    data = request.get_json()
    title = data.get('title')
    abstract = data.get('abstract', '')
    if not title:
        return jsonify(format_response({'error': 'Title is required'}, status=400)), 400
    new_paper = Paper(title=title, abstract=abstract)
    db.session.add(new_paper)
    db.session.commit()
    return jsonify(format_response({'message': 'Paper added successfully'})), 201

@main_api.route('/notes', methods=['GET'])
def get_notes():
    notes = Note.query.all()
    notes_list = [{'id': note.id, 'content': note.content} for note in notes]
    return jsonify(format_response(notes_list))

@main_api.route('/notes', methods=['POST'])
def add_note():
    data = request.get_json()
    content = data.get('content')
    if not content:
        return jsonify(format_response({'error': 'Content is required'}, status=400)), 400
    new_note = Note(content=content)
    db.session.add(new_note)
    db.session.commit()
    return jsonify(format_response({'message': 'Note added successfully'})), 201


from flask import Blueprint, request, jsonify, send_from_directory, abort
from ..models import Plan, Project, Idea, Paper, Note
from .. import db
from ..utils.helper import format_response
from pathlib import Path

main_api = Blueprint('api', __name__, url_prefix='/api')