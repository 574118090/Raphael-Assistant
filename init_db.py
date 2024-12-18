# init_db.py

from app import create_app, db

app = create_app()

with app.app_context():
    db.create_all()
    print("数据库初始化完成。")
