
from flask import Blueprint, render_template
from .controllers.main_controller import main_api
from .controllers.plans_controller import plans_api
from .controllers.notes_controller import notes_api
from .controllers.idea_controller import idea_api
from .controllers.papers_controller import paper_api
from .controllers.projects_controller import project_api

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def home():
    return render_template('index.html')

@main_bp.route('/plans')
def plans():
    return render_template('plans.html')

@main_bp.route('/projects')
def projects():
    return render_template('projects.html')

@main_bp.route('/projects/<string:project_name>')
def view_project(project_name):
    return render_template('view_project.html', project_name=project_name)

@main_bp.route('/ideas')
def ideas():
    return render_template('ideas.html')

@main_bp.route('/ideas/<int:idea_id>')
def view_idea(idea_id):
    return render_template('view_idea.html', idea_id=idea_id)

@main_bp.route('/papers')
def papers():
    return render_template('papers.html')

@main_bp.route('/notes')
def notes():
    return render_template('notes.html')

main_bp.register_blueprint(main_api)
main_bp.register_blueprint(plans_api)
main_bp.register_blueprint(notes_api)
main_bp.register_blueprint(idea_api)
main_bp.register_blueprint(paper_api)
main_bp.register_blueprint(project_api)
