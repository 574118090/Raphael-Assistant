
from flask import Blueprint, request, jsonify
from ..models import Plan
from .. import db
from datetime import datetime

import random

plans_api = Blueprint('plans_api', __name__, url_prefix='/api/plans')

COLOR_PALETTE = [
    '#FF5733',  # 红色
    '#33FF57',  # 绿色
    '#3357FF',  # 蓝色
    '#F1C40F',  # 黄色
    '#9B59B6',  # 紫色
    '#E67E22',  # 橙色
    '#1ABC9C',  # 青色
    '#2ECC71',  # 浅绿色
    '#3498DB',  # 天蓝色
    '#E74C3C'   # 深红色
]

def get_color(plan_id):
    """基于 plan_id 从 COLOR_PALETTE 中选择颜色"""
    random.seed(plan_id)  # 确保颜色一致性
    return random.choice(COLOR_PALETTE)

@plans_api.route('/', methods=['GET'])
def get_plans():
    date_str = request.args.get('date')
    if date_str:
        try:
            selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            plans = Plan.query.filter_by(date=selected_date).all()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400
    else:
        plans = Plan.query.all()
    # 返回 FullCalendar 事件格式，包括随机颜色
    events = [{
        'title': plan.title,
        'start': plan.date.isoformat(),
        'id': plan.id,
        'description': plan.description,
        'color': get_color(plan.id)  # 分配颜色
    } for plan in plans]
    return jsonify(events)

@plans_api.route('/', methods=['POST'])
def add_plan():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    date_str = data.get('date')
    if not title or not date_str:
        return jsonify({'error': 'Title and date are required'}), 400
    try:
        plan_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400
    new_plan = Plan(title=title, description=description, date=plan_date)
    db.session.add(new_plan)
    db.session.commit()
    return jsonify({'message': 'Plan added successfully'}), 201

@plans_api.route('/<int:plan_id>', methods=['DELETE'])
def delete_plan(plan_id):
    plan = Plan.query.get_or_404(plan_id)
    db.session.delete(plan)
    db.session.commit()
    return jsonify({'message': 'Plan deleted successfully'}), 200
