
from flask import Blueprint, jsonify, request, current_app, render_template
import os

notes_api = Blueprint('notes_api', __name__, url_prefix='/api/notes')

@notes_api.route('/list', methods=['GET'])
def list_notes():
    notes_folder = current_app.config['NOTES_FOLDER']
    requested_path = request.args.get('path', '')  # 获取请求的路径

    # 构造绝对路径
    abs_path = os.path.abspath(os.path.join(notes_folder, requested_path))

    # 确保请求的路径在 NOTES_FOLDER 内
    if not abs_path.startswith(os.path.abspath(notes_folder)):
        return jsonify({
            'status': 'error',
            'message': 'Invalid path.'
        }), 400

    if not os.path.exists(abs_path):
        return jsonify({
            'status': 'error',
            'message': 'Path does not exist.'
        }), 404

    items = os.listdir(abs_path)
    notes = []
    for item in items:
        item_path = os.path.join(abs_path, item)
        if os.path.isdir(item_path):
            notes.append({
                'type': 'folder',
                'name': item,
                'path': os.path.join(requested_path, item).replace('\\', '/')
            })
        elif item.endswith('.md'):
            notes.append({
                'type': 'file',
                'name': item,
                'path': os.path.join(requested_path, item).replace('\\', '/')
            })

    # 获取上级目录路径
    parent_path = os.path.dirname(requested_path)
    if parent_path == requested_path:
        parent_path = ''

    return jsonify({
        'status': 'success',
        'data': notes,
        'current_path': requested_path,
        'parent_path': parent_path
    })

@notes_api.route('/create_folder', methods=['POST'])
def create_folder():
    data = request.get_json()
    path = data.get('path', '')
    folder_name = data.get('folder_name', '新文件夹')
    
    # Sanitize folder name
    folder_name = os.path.basename(folder_name)
    
    notes_folder = current_app.config['NOTES_FOLDER']
    abs_path = os.path.abspath(os.path.join(notes_folder, path, folder_name))
    
    # Ensure the path is within NOTES_FOLDER
    if not abs_path.startswith(os.path.abspath(notes_folder)):
        return jsonify({'status': 'error', 'message': 'Invalid path.'}), 400
    
    if os.path.exists(abs_path):
        return jsonify({'status': 'error', 'message': '文件夹已存在。'}), 400
    
    try:
        os.makedirs(abs_path)
        return jsonify({'status': 'success', 'message': '文件夹创建成功。'}), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@notes_api.route('/create_file', methods=['POST'])
def create_file():
    data = request.get_json()
    path = data.get('path', '')
    file_name = data.get('file_name', '新笔记.md')
    
    # Sanitize file name
    file_name = os.path.basename(file_name)
    if not file_name.endswith('.md'):
        file_name += '.md'
    
    notes_folder = current_app.config['NOTES_FOLDER']
    abs_path = os.path.abspath(os.path.join(notes_folder, path, file_name))
    
    # Ensure the path is within NOTES_FOLDER
    if not abs_path.startswith(os.path.abspath(notes_folder)):
        return jsonify({'status': 'error', 'message': 'Invalid path.'}), 400
    
    if os.path.exists(abs_path):
        return jsonify({'status': 'error', 'message': '文件已存在。'}), 400
    
    try:
        with open(abs_path, 'w', encoding='utf-8') as f:
            f.write('')  # 创建空的 markdown 文件
        return jsonify({'status': 'success', 'message': '文件创建成功。'}), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@notes_api.route('/rename', methods=['POST'])
def rename_item():
    data = request.get_json()
    path = data.get('path', '')
    old_name = data.get('old_name')
    new_name = data.get('new_name')
    
    if not old_name or not new_name:
        return jsonify({'status': 'error', 'message': '旧名称和新名称是必需的。'}), 400
    
    # Sanitize new name
    new_name = os.path.basename(new_name)
    
    notes_folder = current_app.config['NOTES_FOLDER']
    old_path = os.path.abspath(os.path.join(notes_folder, path, old_name))
    new_path = os.path.abspath(os.path.join(notes_folder, path, new_name))
    
    # Ensure the paths are within NOTES_FOLDER
    if not old_path.startswith(os.path.abspath(notes_folder)) or not new_path.startswith(os.path.abspath(notes_folder)):
        return jsonify({'status': 'error', 'message': 'Invalid path.'}), 400
    
    if not os.path.exists(old_path):
        return jsonify({'status': 'error', 'message': '原文件或文件夹不存在。'}), 404
    
    if os.path.exists(new_path):
        return jsonify({'status': 'error', 'message': '新名称已存在。'}), 400
    
    try:
        os.rename(old_path, new_path)
        return jsonify({'status': 'success', 'message': '重命名成功。'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

import os
import shutil
from flask import request, jsonify, current_app

import os
import shutil
from flask import request, jsonify, current_app

@notes_api.route('/delete', methods=['POST'])
def delete_item():
    data = request.get_json()
    path = data.get('path', '')
    name = data.get('name')
    force_delete = data.get('forceDelete', False)  # 获取是否强制删除的标志
    
    if not name:
        return jsonify({'status': 'error', 'message': '名称是必需的。'}), 400
    
    notes_folder = current_app.config['NOTES_FOLDER']
    abs_path = os.path.abspath(os.path.join(notes_folder, path, name))
    
    # Ensure the path is within NOTES_FOLDER
    if not abs_path.startswith(os.path.abspath(notes_folder)):
        return jsonify({'status': 'error', 'message': 'Invalid path.'}), 400
    
    if not os.path.exists(abs_path):
        return jsonify({'status': 'error', 'message': '文件或文件夹不存在。'}), 404
    
    try:
        if os.path.isdir(abs_path):
            shutil.rmtree(abs_path)
        else:
            # 删除文件
            os.remove(abs_path)
        
        return jsonify({'status': 'success', 'message': '删除成功。'}), 200
    except OSError as e:
        return jsonify({'status': 'error', 'message': '目录不为空或其他错误。'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500



@notes_api.route('/get_file', methods=['GET'])
def get_file():
    path = request.args.get('path', '')
    if not path.endswith('.md'):
        return jsonify({'status': 'error', 'message': '仅支持 Markdown 文件。'}), 400

    notes_folder = current_app.config['NOTES_FOLDER']
    abs_path = os.path.abspath(os.path.join(notes_folder, path))

    # Ensure the path is within NOTES_FOLDER
    if not abs_path.startswith(os.path.abspath(notes_folder)):
        return jsonify({'status': 'error', 'message': 'Invalid path.'}), 400

    if not os.path.exists(abs_path):
        return jsonify({'status': 'error', 'message': '文件不存在。'}), 404

    try:
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return jsonify({'status': 'success', 'content': content}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@notes_api.route('/update_file', methods=['POST'])
def update_file():
    data = request.get_json()
    path = data.get('path', '')
    content = data.get('content', '')
    
    if not path.endswith('.md'):
        return jsonify({'status': 'error', 'message': '仅支持 Markdown 文件。'}), 400

    notes_folder = current_app.config['NOTES_FOLDER']
    abs_path = os.path.abspath(os.path.join(notes_folder, path))

    # Ensure the path is within NOTES_FOLDER
    if not abs_path.startswith(os.path.abspath(notes_folder)):
        return jsonify({'status': 'error', 'message': 'Invalid path.'}), 400

    if not os.path.exists(abs_path):
        return jsonify({'status': 'error', 'message': '文件不存在。'}), 404

    try:
        with open(abs_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return jsonify({'status': 'success', 'message': '文件保存成功。'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@notes_api.route('/get_content', methods=['GET'])
def get_content():
    path = request.args.get('path', '')
    notes_folder = current_app.config['NOTES_FOLDER']
    abs_path = os.path.abspath(os.path.join(notes_folder, path))

    # 确保路径在 NOTES_FOLDER 内
    if not abs_path.startswith(os.path.abspath(notes_folder)):
        return jsonify({'status': 'error', 'message': 'Invalid path.'}), 400

    if not os.path.isfile(abs_path):
        return jsonify({'status': 'error', 'message': 'File does not exist.'}), 404

    try:
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return jsonify({'status': 'success', 'content': content}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@notes_api.route('/save_content', methods=['POST'])
def save_content():
    data = request.get_json()
    path = data.get('path', '')
    content = data.get('content', '')

    notes_folder = current_app.config['NOTES_FOLDER']
    abs_path = os.path.abspath(os.path.join(notes_folder, path))

    # 确保路径在 NOTES_FOLDER 内
    if not abs_path.startswith(os.path.abspath(notes_folder)):
        return jsonify({'status': 'error', 'message': 'Invalid path.'}), 400

    if not os.path.isfile(abs_path):
        return jsonify({'status': 'error', 'message': 'File does not exist.'}), 404

    try:
        with open(abs_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return jsonify({'status': 'success', 'message': 'Content saved successfully.'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@notes_api.route('/view', methods=['GET'])
def view_note():
    path = request.args.get('path', '')
    notes_folder = current_app.config['NOTES_FOLDER']
    abs_path = os.path.abspath(os.path.join(notes_folder, path))

    # 确保路径在 NOTES_FOLDER 内
    if not abs_path.startswith(os.path.abspath(notes_folder)):
        return "Invalid path.", 400

    if not os.path.isfile(abs_path):
        return "File does not exist.", 404

    return render_template('view_note.html', path=path)

