
import os
import uuid
import requests
import shutil
import logging
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from sqlalchemy.exc import SQLAlchemyError
from .. import db
from ..models import Paper  # 确保 Paper 模型已定义
from ..utils.helper import format_response
from config import Config

logging.basicConfig(level=logging.DEBUG)

paper_api = Blueprint('paper_api', __name__, url_prefix='/api/papers')

ALLOWED_EXTENSIONS = {'pdf', 'txt', 'doc', 'docx', 'md'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@paper_api.route('', methods=['GET'])
def get_papers():
    category_filter = request.args.get('category', None)  # 按分类过滤

    query = Paper.query

    if category_filter:
        # 实现模糊搜索，使用 LIKE 查询
        query = query.filter(
            (Paper.category.ilike(f'%{category_filter}%')) |
            (Paper.title.ilike(f'%{category_filter}%'))
        )
    
    # 使用默认排序方式（例如按创建时间降序）
    query = query.order_by(Paper.created_at.desc())

    try:
        papers = query.all()
    except SQLAlchemyError as e:
        logging.error(f"数据库查询错误：{str(e)}")
        return jsonify(format_response({'error': '无法获取论文列表。'}, status=500)), 500

    papers_list = []
    for paper in papers:
        folder_path = os.path.join(Config.PAPERS_FOLDER, secure_filename(paper.id))
        if os.path.exists(folder_path):
            files = os.listdir(folder_path)
        else:
            files = []
        papers_list.append({
            'id': paper.id,
            'title': paper.title,
            'category': paper.category,
            'starred': paper.starred,
            'files': files,
            'created_at': paper.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    return jsonify(format_response(papers_list)), 200

@paper_api.route('', methods=['POST'])
def create_paper():
    title = request.form.get('title')
    pdf_url = request.form.get('pdf_url')
    category = request.form.get('category')  # 获取分类
    # 已移除文件上传部分
    # files = request.files.getlist('files')
    
    if not title:
        return jsonify(format_response({'error': '论文标题是必填项。'}, status=400)), 400
    
    if not pdf_url:
        return jsonify(format_response({'error': 'PDF 地址是必填项。'}, status=400)), 400

    # 生成唯一的论文ID
    paper_id = str(uuid.uuid4())
    paper_folder = os.path.join(Config.PAPERS_FOLDER, secure_filename(paper_id))
    
    try:
        os.makedirs(paper_folder, exist_ok=True)
        logging.debug(f"创建论文文件夹：{paper_folder}")
    except Exception as e:
        logging.error(f"无法创建论文文件夹：{str(e)}")
        return jsonify(format_response({'error': f'无法创建论文文件夹：{str(e)}'}, status=500)), 500
    
    # 如果提供了 PDF URL，下载 PDF
    try:
        response = requests.get(pdf_url, timeout=10)  # 添加超时限制
        response.raise_for_status()
        pdf_filename = secure_filename(os.path.basename(pdf_url))
        if not allowed_file(pdf_filename):
            pdf_filename += '.pdf'  # 默认扩展名
        pdf_path = os.path.join(paper_folder, pdf_filename)
        with open(pdf_path, 'wb') as f:
            f.write(response.content)
        logging.debug(f"下载并保存 PDF 文件：{pdf_path}")
    except Exception as e:
        logging.error(f"无法下载 PDF 文件：{str(e)}")
        shutil.rmtree(paper_folder, ignore_errors=True)  # 清理已创建的文件夹
        return jsonify(format_response({'error': f'无法下载 PDF 文件：{str(e)}'}, status=400)), 400
    
    # 在数据库中记录论文信息
    new_paper = Paper(id=paper_id, title=title, folder=paper_folder, category=category)
    try:
        db.session.add(new_paper)
        db.session.commit()
        logging.debug(f"论文记录已保存到数据库：{new_paper}")
    except SQLAlchemyError as e:
        # 如果数据库操作失败，删除已创建的文件夹
        shutil.rmtree(paper_folder, ignore_errors=True)
        logging.error(f"无法保存论文信息到数据库：{str(e)}")
        return jsonify(format_response({'error': f'无法保存论文信息到数据库：{str(e)}'}, status=500)), 500
    
    return jsonify(format_response({'message': '论文创建成功。', 'id': paper_id})), 201

@paper_api.route('/<paper_id>/notes', methods=['POST'])
def upload_notes(paper_id):
    files = request.files.getlist('notes_files')
    paper_folder = os.path.join(Config.PAPERS_FOLDER, secure_filename(paper_id))
    
    if not os.path.exists(paper_folder):
        return jsonify(format_response({'error': '论文不存在。'}, status=404)), 404
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(paper_folder, filename))
    
    return jsonify(format_response({'message': '笔记上传成功。'})), 200

@paper_api.route('/<paper_id>/download/<filename>', methods=['GET'])
def download_file(paper_id, filename):
    paper_folder = os.path.join(Config.PAPERS_FOLDER, secure_filename(paper_id))
    print(paper_folder)
    if not os.path.exists(paper_folder):
        return jsonify(format_response({'error': '论文不存在。'}, status=404)), 404
    if not os.path.exists(os.path.join(paper_folder, filename)):
        return jsonify(format_response({'error': '文件不存在。'}, status=404)), 404
    return send_from_directory(paper_folder, filename, as_attachment=False)

@paper_api.route('/view/<paper_id>/<filename>', methods=['GET'])
def view_pdf(paper_id, filename):
    safe_paper_id = secure_filename(paper_id)
    paper_folder = os.path.join(Config.PAPERS_FOLDER, safe_paper_id)
    print(paper_folder)
    try:
        return send_from_directory(
            directory=paper_folder,
            path=filename,
            mimetype='application/pdf',
            as_attachment=False  # 设置为 False 以允许浏览器内联显示
        )
    except Exception as e:
        # 记录异常日志（可选）
        # app.logger.error(f"无法发送文件 {file_path}: {str(e)}")
        print(e)
        return jsonify(format_response({'error': '无法发送文件。'}, status=500)), 500

@paper_api.route('/<paper_id>', methods=['DELETE'])
def delete_paper(paper_id):
    paper = Paper.query.get(paper_id)
    if not paper:
        return jsonify(format_response({'error': '论文不存在。'}, status=404)), 404
    
    paper_folder = os.path.join(Config.PAPERS_FOLDER, secure_filename(paper.id))
    try:
        shutil.rmtree(paper_folder)
        logging.debug(f"删除论文文件夹：{paper_folder}")
    except Exception as e:
        logging.error(f"无法删除论文文件夹：{str(e)}")
        return jsonify(format_response({'error': f'无法删除论文文件夹：{str(e)}'}, status=500)), 500
    
    try:
        db.session.delete(paper)
        db.session.commit()
        logging.debug(f"论文记录已从数据库删除：{paper}")
    except SQLAlchemyError as e:
        logging.error(f"无法删除论文记录：{str(e)}")
        return jsonify(format_response({'error': f'无法删除论文记录：{str(e)}'}, status=500)), 500
    
    return jsonify(format_response({'message': '论文删除成功。'})), 200

@paper_api.route('/<paper_id>/star', methods=['PUT'])
def star_paper(paper_id):
    paper = Paper.query.get(paper_id)
    if not paper:
        return jsonify(format_response({'error': '论文不存在。'}, status=404)), 404
    
    data = request.get_json()
    if not data or 'starred' not in data:
        return jsonify(format_response({'error': '缺少 "starred" 字段。'}, status=400)), 400
    
    paper.starred = data['starred']
    try:
        db.session.commit()
        return jsonify(format_response({'message': '论文星标状态更新成功。'})), 200
    except SQLAlchemyError as e:
        logging.error(f"无法更新星标状态：{str(e)}")
        return jsonify(format_response({'error': f'无法更新星标状态：{str(e)}'}, status=500)), 500
