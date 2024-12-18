
from flask import Blueprint, request, jsonify
from ..models import Idea, RelatedPaper
from .. import db
from ..utils.helper import format_response

idea_api = Blueprint('idea_api', __name__, url_prefix='/api/ideas')

@idea_api.route('', methods=['GET'])
def get_ideas():
    ideas = Idea.query.all()
    ideas_list = [{'id': idea.id, 'title': idea.title, 'description': idea.description} for idea in ideas]
    return jsonify(format_response(ideas_list)), 200

@idea_api.route('', methods=['POST'])
def add_idea():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    if not title or not description:
        return jsonify(format_response({'error': '标题和描述是必填项'}, status=400)), 400
    new_idea = Idea(title=title, description=description)
    db.session.add(new_idea)
    db.session.commit()
    return jsonify(format_response({'message': '想法添加成功', 'id': new_idea.id})), 201

@idea_api.route('/<int:idea_id>', methods=['GET'])
def get_idea_detail(idea_id):
    idea = Idea.query.get_or_404(idea_id)
    idea_detail = {
        'id': idea.id,
        'title': idea.title,
        'description': idea.description,
        'background': idea.background,
        'motivation': idea.motivation,
        'challenge': idea.challenge,
        'method': idea.method,
        'experiment': idea.experiment,
        'innovation': idea.innovation,
        'papers': idea.papers,
        'related_papers': [{'id': rp.id, 'title': rp.title, 'content': rp.content, 'link': rp.link} for rp in idea.related_papers]
    }
    return jsonify(format_response(idea_detail)), 200

@idea_api.route('/<int:idea_id>', methods=['PUT'])
def update_idea_detail(idea_id):
    idea = Idea.query.get_or_404(idea_id)
    data = request.get_json()
    idea.title = data.get('title', idea.title)
    idea.description = data.get('description', idea.description)
    idea.background = data.get('background', idea.background)
    idea.motivation = data.get('motivation', idea.motivation)
    idea.challenge = data.get('challenge', idea.challenge)
    idea.method = data.get('method', idea.method)
    idea.experiment = data.get('experiment', idea.experiment)
    idea.innovation = data.get('innovation', idea.innovation)
    idea.papers = data.get('papers', idea.papers)
    db.session.commit()
    return jsonify(format_response({'message': '想法更新成功'})), 200

@idea_api.route('/<int:idea_id>', methods=['DELETE'])
def delete_idea(idea_id):
    idea = Idea.query.get_or_404(idea_id)
    db.session.delete(idea)
    db.session.commit()
    return jsonify(format_response({'message': '想法删除成功'})), 200

@idea_api.route('/<int:idea_id>/related_papers', methods=['POST'])
def add_related_paper(idea_id):
    idea = Idea.query.get_or_404(idea_id)
    data = request.get_json()
    title = data.get('title')
    content = data.get('content', '')
    link = data.get('link', '')
    if not title:
        return jsonify(format_response({'error': '论文标题是必填项'}, status=400)), 400
    new_paper = RelatedPaper(title=title, content=content, link=link, idea=idea)
    db.session.add(new_paper)
    db.session.commit()
    return jsonify(format_response({'message': '关联论文添加成功', 'id': new_paper.id})), 201

@idea_api.route('/<int:idea_id>/related_papers/<int:paper_id>', methods=['PUT'])
def update_related_paper(idea_id, paper_id):
    idea = Idea.query.get_or_404(idea_id)
    paper = RelatedPaper.query.filter_by(id=paper_id, idea_id=idea_id).first_or_404()
    data = request.get_json()
    paper.title = data.get('title', paper.title)
    paper.content = data.get('content', paper.content)
    paper.link = data.get('link', paper.link)
    db.session.commit()
    return jsonify(format_response({'message': '关联论文更新成功'})), 200

@idea_api.route('/<int:idea_id>/related_papers/<int:paper_id>', methods=['DELETE'])
def delete_related_paper(idea_id, paper_id):
    idea = Idea.query.get_or_404(idea_id)
    paper = RelatedPaper.query.filter_by(id=paper_id, idea_id=idea_id).first_or_404()
    db.session.delete(paper)
    db.session.commit()
    return jsonify(format_response({'message': '关联论文删除成功'})), 200
