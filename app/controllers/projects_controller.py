# app/controllers/project_controller.py

import os
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from .. import db
from ..models import Project, Task, Milestone
from ..utils.helper import format_response
from config import Config
from datetime import datetime

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'docx', 'xlsx'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

project_api = Blueprint('project_api', __name__, url_prefix='/api/projects')

@project_api.route('/', methods=['GET'])
def list_projects():
    projects = Project.query.all()
    projects_list = [{
        'name': project.name,
        'description': project.description,
        'client': project.client,
        'type': project.type
    } for project in projects]
    return jsonify(format_response(projects_list))

@project_api.route('/<string:project_name>', methods=['PUT'])
def edit_project(project_name):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    data = request.get_json()
    new_name = data.get('name')
    new_description = data.get('description', project.description)
    new_client = data.get('client')
    new_type = data.get('type')

    if not new_name or not new_client or not new_type:
        return jsonify(format_response({'error': '名称、甲方和类型是必填字段'}, status=400)), 400

    # Check if new_name is different and already exists
    if new_name != project.name:
        existing_project = Project.query.filter_by(name=new_name).first()
        if existing_project:
            return jsonify(format_response({'error': '新项目名称已存在'}, status=400)), 400

    try:
        # 更新数据库记录
        project.name = new_name
        project.description = new_description
        project.client = new_client
        project.type = new_type
        db.session.commit()

        # 重命名项目文件夹
        old_project_path = os.path.join(Config.PROJECTS_FOLDER, project_name)
        new_project_path = os.path.join(Config.PROJECTS_FOLDER, new_name)

        # 如果项目文件夹名称发生变化，则重命名文件夹
        if old_project_path != new_project_path:
            os.rename(old_project_path, new_project_path)

        return jsonify(format_response({'message': '项目更新成功'})), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response({'error': str(e)}, status=500)), 500


@project_api.route('/', methods=['POST'])
def create_project():
    data = request.get_json()
    project_name = data.get('name')
    description = data.get('description', '')
    client = data.get('client')
    project_type = data.get('type')

    if not project_name or not client or not project_type:
        return jsonify(format_response({'error': '项目名称、甲方和类型是必填字段'}, status=400)), 400

    if Project.query.filter_by(name=project_name).first():
        return jsonify(format_response({'error': '项目名称已存在'}, status=400)), 400

    try:
        # 创建项目文件夹
        project_path = os.path.join(Config.PROJECTS_FOLDER, project_name)
        os.makedirs(project_path)

        # 创建项目数据库记录
        new_project = Project(
            name=project_name,
            description=description,
            client=client,
            type=project_type
        )
        db.session.add(new_project)
        db.session.commit()
        return jsonify(format_response({'message': '项目创建成功'})), 201
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500

@project_api.route('/<string:project_name>', methods=['DELETE'])
def delete_project(project_name):
    project = Project.query.filter_by(name=project_name).first()

    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    try:
        # 删除项目文件夹
        project_path = os.path.join(Config.PROJECTS_FOLDER, project_name)
        if os.path.exists(project_path):
            if os.listdir(project_path):
                return jsonify(format_response({'error': '项目文件夹不为空'}, status=400)), 400
            os.rmdir(project_path)

        # 删除项目数据库记录
        db.session.delete(project)
        db.session.commit()
        return jsonify(format_response({'message': '项目删除成功'})), 200
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500

# 获取项目文件列表
@project_api.route('/<string:project_name>/files', methods=['GET'])
def list_project_files(project_name):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    project_path = os.path.join(Config.PROJECTS_FOLDER, project_name)
    if not os.path.exists(project_path):
        return jsonify(format_response({'error': '项目文件夹不存在'}, status=404)), 404

    try:
        files = []
        for root, dirs, filenames in os.walk(project_path):
            for filename in filenames:
                filepath = os.path.join(root, filename)
                relative_path = os.path.relpath(filepath, project_path)
                files.append(relative_path.replace('\\', '/'))  # 兼容Windows路径
        return jsonify(format_response(files)), 200
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500

# 下载项目文件
@project_api.route('/<string:project_name>/files/<path:filename>', methods=['GET'])
def get_project_file(project_name, filename):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    project_path = os.path.join(Config.PROJECTS_FOLDER, project_name)
    if not os.path.exists(project_path):
        return jsonify(format_response({'error': '项目文件夹不存在'}, status=404)), 404

    file_path = os.path.join(project_path, filename)
    if not os.path.isfile(file_path):
        return jsonify(format_response({'error': '文件不存在'}, status=404)), 404

    try:
        directory = os.path.dirname(file_path)
        filename_only = os.path.basename(file_path)
        return send_from_directory(directory, filename_only, as_attachment=True)
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500

# 文件上传
@project_api.route('/<string:project_name>/upload', methods=['POST'])
def upload_file(project_name):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    project_path = os.path.join(Config.PROJECTS_FOLDER, project_name)
    if not os.path.exists(project_path):
        return jsonify(format_response({'error': '项目文件夹不存在'}, status=404)), 404

    if 'file' not in request.files:
        return jsonify(format_response({'error': '没有文件被上传'}, status=400)), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify(format_response({'error': '没有选择文件'}, status=400)), 400

    if file and allowed_file(file.filename):
        filename = file.filename
        # 默认上传到项目根目录，可以根据需要添加分类逻辑
        file.save(os.path.join(project_path, filename))
        return jsonify(format_response({'message': '文件上传成功'})), 201
    else:
        return jsonify(format_response({'error': '文件类型不允许'}, status=400)), 400

# 删除文件
@project_api.route('/<string:project_name>/files/<path:filename>', methods=['DELETE'])
def delete_file(project_name, filename):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    project_path = os.path.join(Config.PROJECTS_FOLDER, project_name)
    file_path = os.path.join(project_path, filename)

    if not os.path.isfile(file_path):
        return jsonify(format_response({'error': '文件不存在'}, status=404)), 404

    try:
        os.remove(file_path)
        return jsonify(format_response({'message': '文件删除成功'})), 200
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500

# 任务管理
@project_api.route('/<string:project_name>/tasks', methods=['GET'])
def list_tasks(project_name):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    tasks = Task.query.filter_by(project_id=project.id).all()
    tasks_list = [{
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'status': task.status
    } for task in tasks]
    return jsonify(format_response(tasks_list)), 200

@project_api.route('/<string:project_name>/tasks', methods=['POST'])
def create_task(project_name):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    status = data.get('status', 'Pending')

    if not title:
        return jsonify(format_response({'error': '任务标题是必填字段'}, status=400)), 400

    try:
        new_task = Task(
            title=title,
            description=description,
            status=status,
            project_id=project.id
        )
        db.session.add(new_task)
        db.session.commit()
        return jsonify(format_response({'message': '任务创建成功'})), 201
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500

@project_api.route('/<string:project_name>/tasks/<int:task_id>', methods=['PUT'])
def update_task(project_name, task_id):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    task = Task.query.filter_by(id=task_id, project_id=project.id).first()
    if not task:
        return jsonify(format_response({'error': '任务不存在'}, status=404)), 404

    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    status = data.get('status')

    if title:
        task.title = title
    if description:
        task.description = description
    if status:
        if status not in ['Pending', 'In Progress', 'Completed']:
            return jsonify(format_response({'error': '无效的任务状态'}, status=400)), 400
        task.status = status

    try:
        db.session.commit()
        return jsonify(format_response({'message': '任务更新成功'})), 200
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500

@project_api.route('/<string:project_name>/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(project_name, task_id):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    task = Task.query.filter_by(id=task_id, project_id=project.id).first()
    if not task:
        return jsonify(format_response({'error': '任务不存在'}, status=404)), 404

    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify(format_response({'message': '任务删除成功'})), 200
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500

# 里程碑管理
@project_api.route('/<string:project_name>/milestones', methods=['GET'])
def list_milestones(project_name):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    milestones = Milestone.query.filter_by(project_id=project.id).all()
    milestones_list = [{
        'id': milestone.id,
        'title': milestone.title,
        'description': milestone.description,
        'date': milestone.date.strftime('%Y-%m-%d')
    } for milestone in milestones]
    return jsonify(format_response(milestones_list)), 200

@project_api.route('/<string:project_name>/milestones', methods=['POST'])
def create_milestone(project_name):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    date_str = data.get('date')  # Expecting 'YYYY-MM-DD'

    if not title or not date_str:
        return jsonify(format_response({'error': '里程碑标题和日期是必填字段'}, status=400)), 400

    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify(format_response({'error': '日期格式不正确，应为 YYYY-MM-DD'}, status=400)), 400

    try:
        new_milestone = Milestone(
            title=title,
            description=description,
            date=date,
            project_id=project.id
        )
        db.session.add(new_milestone)
        db.session.commit()
        return jsonify(format_response({'message': '里程碑创建成功'})), 201
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500

@project_api.route('/<string:project_name>/milestones/<int:milestone_id>', methods=['PUT'])
def update_milestone(project_name, milestone_id):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    milestone = Milestone.query.filter_by(id=milestone_id, project_id=project.id).first()
    if not milestone:
        return jsonify(format_response({'error': '里程碑不存在'}, status=404)), 404

    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    date_str = data.get('date')

    if title:
        milestone.title = title
    if description:
        milestone.description = description
    if date_str:
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            milestone.date = date
        except ValueError:
            return jsonify(format_response({'error': '日期格式不正确，应为 YYYY-MM-DD'}, status=400)), 400

    try:
        db.session.commit()
        return jsonify(format_response({'message': '里程碑更新成功'})), 200
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500

@project_api.route('/<string:project_name>/milestones/<int:milestone_id>', methods=['DELETE'])
def delete_milestone(project_name, milestone_id):
    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify(format_response({'error': '项目不存在'}, status=404)), 404

    milestone = Milestone.query.filter_by(id=milestone_id, project_id=project.id).first()
    if not milestone:
        return jsonify(format_response({'error': '里程碑不存在'}, status=404)), 404

    try:
        db.session.delete(milestone)
        db.session.commit()
        return jsonify(format_response({'message': '里程碑删除成功'})), 200
    except Exception as e:
        return jsonify(format_response({'error': str(e)}, status=500)), 500
