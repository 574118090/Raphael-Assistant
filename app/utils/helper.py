import platform
import subprocess
from plyer import notification
import logging
import os

logger = logging.getLogger(__name__)

def format_response(data, status=200):
    return {
        'status': status,
        'data': data
    }

def notify(title, message):
    current_os = platform.system()
    try:
        if current_os == "Windows":
            # 使用 plyer 进行 Windows 通知
            notification.notify(
                title=title,
                message=message,
                app_name='Raphael',
                # 可选：添加图标路径
                # app_icon=os.path.join('app', 'static', 'images', 'Raphael.ico')
            )
        elif current_os == "Darwin":
            # 使用 AppleScript 进行 macOS 通知
            script = f'display notification "{message}" with title "{title}"'
            subprocess.run(["osascript", "-e", script])
        else:
            # 使用 plyer 作为其他操作系统的备用
            notification.notify(
                title=title,
                message=message,
                app_name='Raphael'
            )
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")