
from . import db
from datetime import date

class Plan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date, nullable=False, default=date.today)  # 新增日期字段

    def __repr__(self):
        return f"<Plan {self.title} on {self.date}>"

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    client = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)

    tasks = db.relationship('Task', backref='project', cascade="all, delete-orphan", lazy=True)
    milestones = db.relationship('Milestone', backref='project', cascade="all, delete-orphan", lazy=True)

    def __repr__(self):
        return f"<Project {self.name}>"

class Idea(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    background = db.Column(db.String(255), nullable=True)
    motivation = db.Column(db.String(255), nullable=True)
    challenge = db.Column(db.String(255), nullable=True)
    method = db.Column(db.String(255), nullable=True)
    experiment = db.Column(db.String(255), nullable=True)
    innovation = db.Column(db.String(255), nullable=True)
    papers = db.Column(db.String(255), nullable=True)

    # 一对多关系：一个Idea有多个RelatedPapers
    related_papers = db.relationship('RelatedPaper', backref='idea', cascade="all, delete-orphan", lazy=True)

    def __repr__(self):
        return f"<Idea {self.title}>"

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Pending')  # e.g., Pending, In Progress, Completed
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)

    def __repr__(self):
        return f"<Task {self.title} - {self.status}>"

class Milestone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)

    def __repr__(self):
        return f"<Milestone {self.title} - {self.date}>"

class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=True)  # 分类或标签
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)

    def __repr__(self):
        return f"<File {self.filename} - {self.category}>"

class RelatedPaper(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=True)
    link = db.Column(db.String(255), nullable=True)

    # 外键关联到Idea
    idea_id = db.Column(db.Integer, db.ForeignKey('idea.id'), nullable=False)

    def __repr__(self):
        return f"<RelatedPaper {self.title}>"

class Paper(db.Model):
    id = db.Column(db.String(36), primary_key=True)  # UUID
    title = db.Column(db.String(255), nullable=False)
    folder = db.Column(db.String(500), nullable=False)  # 文件夹路径
    category = db.Column(db.String(100), nullable=True)  # 论文分类
    starred = db.Column(db.Boolean, default=False)  # 标星状态
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    def __repr__(self):
        return f"<Paper {self.title}>"

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f"<Note {self.id}>"
