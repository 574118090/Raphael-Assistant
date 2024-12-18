# config.py

import os
import sys
from pathlib import Path

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key')
    PORT = 21823
    DEBUG = False

    REMOTE_DB = {
        'ADDRESS': os.environ.get('DB_ADDRESS'),
        'USERNAME': os.environ.get('DB_USERNAME'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'DB_NAME': os.environ.get('DB_NAME'),
    }

    USE_REMOTE_DB = False
    NOTIFICATION_API_KEY = "your-secure-api-key"
    
    # 获取操作系统平台
    platform = sys.platform

    # 获取"我的文档"目录路径，适配不同平台
    if platform == "win32":  # Windows 系统
        DOCUMENTS_DIR = str(Path.home() / "Documents")
    elif platform == "darwin":  # macOS 系统
        DOCUMENTS_DIR = str(Path.home() / "Documents")
    else:  # Linux 系统
        DOCUMENTS_DIR = str(Path.home() / "Documents")

    # 创建 Raphael 文件夹路径
    RAPHAEL_DIR = os.path.join(DOCUMENTS_DIR, "Raphael")

    BASE_DIR = RAPHAEL_DIR

    # 确保 Raphael 文件夹存在
    os.makedirs(BASE_DIR, exist_ok=True)

    # 创建数据文件夹
    NOTES_FOLDER = os.path.join(BASE_DIR, 'notes')
    PAPERS_FOLDER = os.path.join(BASE_DIR, 'papers')
    PROJECTS_FOLDER = os.path.join(BASE_DIR, 'projects')

    os.makedirs(NOTES_FOLDER, exist_ok=True)
    os.makedirs(PAPERS_FOLDER, exist_ok=True)
    os.makedirs(PROJECTS_FOLDER, exist_ok=True)

    # 本地数据库路径应该指向"我的文档"下的 Raphael 文件夹
    LOCAL_DB_URI = f"sqlite:///{os.path.join(BASE_DIR, 'database.db')}"

    # 配置数据库 URI
    if USE_REMOTE_DB and all(REMOTE_DB.values()):
        SQLALCHEMY_DATABASE_URI = f"postgresql://{REMOTE_DB['USERNAME']}:{REMOTE_DB['PASSWORD']}@{REMOTE_DB['ADDRESS']}/{REMOTE_DB['DB_NAME']}"
    else:
        SQLALCHEMY_DATABASE_URI = LOCAL_DB_URI

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 快捷键配置
    SHORTCUT_KEY = os.environ.get('SHORTCUT_KEY', 'alt+r')  # 默认快捷键为 Alt + R
