import platform
import os
import sys
import logging
from config import Config  # 提前导入 Config 以访问 Config.debug

# Conditionally import winreg for Windows
if platform.system() == "Windows":
    import winreg

import threading
import pystray
from app.utils.helper import notify
from pystray import MenuItem as item
from PIL import Image
import webbrowser

from app import create_app, db
from plyer import notification

# For keyboard events
import keyboard  # Consider using pynput for cross-platform support

# 根据 Config.debug 配置日志记录
if Config.DEBUG:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        handlers=[
            logging.FileHandler("raphael.log"),
            logging.StreamHandler()
        ]
    )
else:
    # 禁用所有日志记录
    logging.basicConfig(level=logging.CRITICAL)
    logging.disable(logging.CRITICAL)

logger = logging.getLogger(__name__)

app = create_app()

def create_image():
    current_os = platform.system()
    if current_os == "Windows":
        icon_filename = 'Raphael.ico'
    elif current_os == "Darwin":
        icon_filename = 'Raphael.png'
    else:
        icon_filename = 'Raphael.png'
    
    icon_path = os.path.join(os.path.dirname(__file__), 'app', 'static', 'images', icon_filename)
    if not os.path.exists(icon_path):
        logger.warning(f"Icon file not found: {icon_path}. Using default icon.")
        image = Image.new('RGB', (64, 64), color='blue')
    else:
        image = Image.open(icon_path)
    return image

def on_quit(icon, item):
    logger.info("Quitting Raphael.")
    icon.stop()
    exit_event.set()
    sys.exit()

def open_webpage(icon, item):
    logger.info("Opening Raphael webpage.")
    webbrowser.open(f"http://127.0.0.1:{Config.PORT}")

def on_double_click(icon, mouse_event):
    logger.info("Icon double-clicked, opening webpage.")
    webbrowser.open(f"http://127.0.0.1:{Config.PORT}")

def initialize_registry():
    current_os = platform.system()
    if current_os != "Windows":
        logger.info("Registry initialization skipped on non-Windows OS.")
        return
    try:
        registry = winreg.ConnectRegistry(None, winreg.HKEY_CURRENT_USER)
        key_path = r"Software\LizheChen\Raphael"
        
        # 检查键是否存在
        try:
            key = winreg.OpenKey(registry, key_path, 0, winreg.KEY_READ)
            winreg.CloseKey(key)
        except FileNotFoundError:
            # 如果不存在，创建键并设置默认值
            key = winreg.CreateKey(registry, key_path)
            winreg.SetValueEx(key, "EnableShortcuts", 0, winreg.REG_SZ, "True")
            winreg.CloseKey(key)
            logger.info("Registry key created with default settings.")
    except Exception as e:
        logger.error(f"Error initializing registry: {e}")

def get_shortcut_status():
    current_os = platform.system()
    if current_os != "Windows":
        logger.info("Shortcut status retrieval skipped on non-Windows OS.")
        return True
    try:
        registry = winreg.ConnectRegistry(None, winreg.HKEY_CURRENT_USER)
        key = winreg.OpenKey(registry, r"Software\LizheChen\Raphael", 0, winreg.KEY_READ)
        value, _ = winreg.QueryValueEx(key, "EnableShortcuts")
        winreg.CloseKey(key)
        return value == "True"
    except (FileNotFoundError, OSError) as e:
        logger.warning(f"Failed to get shortcut status: {e}. Defaulting to True.")
        return True  

def set_shortcut_status(enable=True):
    current_os = platform.system()
    if current_os != "Windows":
        logger.info("Setting shortcut status skipped on non-Windows OS.")
        return
    try:
        registry = winreg.ConnectRegistry(None, winreg.HKEY_CURRENT_USER)
        key = winreg.OpenKey(registry, r"Software\LizheChen\Raphael", 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, "EnableShortcuts", 0, winreg.REG_SZ, "True" if enable else "False")
        winreg.CloseKey(key)
        logger.info(f"Shortcut status set to {'enabled' if enable else 'disabled'}.")
    except Exception as e:
        logger.error(f"Failed to set shortcut status: {e}")

def toggle_shortcut(icon, item):
    current_status = get_shortcut_status()
    set_shortcut_status(not current_status)
    notify("Raphael", f"Shortcuts {'Enabled' if not current_status else 'Disabled'}.")
    icon.update_menu()

def create_tray():
    icon = pystray.Icon("Raphael", create_image(), menu=(
        item("访问", open_webpage),
        item("启用快捷键", toggle_shortcut, checked=lambda item: get_shortcut_status()),
        item("退出", on_quit),
    ))

    # 设置双击事件处理器
    icon.on_double_click = on_double_click

    # 运行托盘图标
    icon.run()

def run_flask():
    try:
        # 初始化数据库（创建表）
        with app.app_context():
            db.create_all()
            logger.info("Database initialized.")
        
        notify("Raphael", "Raphael is running.")
        app.run(host="localhost", port=Config.PORT, debug=False)
    except Exception as e:
        logger.error(f"Flask application failed to start: {e}")
        notify("Raphael Error", "Failed to start the Flask application.")
        exit_event.set()

pressed_keys = set()
has_opened_webpage = False  

def on_key_event(keyboard_event):
    global has_opened_webpage

    if get_shortcut_status():
        shortcut_keys = Config.SHORTCUT_KEY.split('+')
        if len(shortcut_keys) == 2:
            modifier, key = shortcut_keys
            if (keyboard_event.name == key.lower() and keyboard.is_pressed(modifier.lower())) and not has_opened_webpage:
                logger.info(f"Pressed {Config.SHORTCUT_KEY}, opening webpage.")
                webbrowser.open(f"http://127.0.0.1:{Config.PORT}")
                has_opened_webpage = True  
    
    if keyboard_event.event_type == keyboard.KEY_UP:
        if keyboard_event.name in [mod.lower() for mod in Config.SHORTCUT_KEY.split('+')]:
            has_opened_webpage = False  

def start_key_listener():
    try:
        keyboard.hook(on_key_event)  
        keyboard.wait()
    except Exception as e:
        logger.error(f"Key listener encountered an error: {e}")
        notify("Raphael Error", "Key listener encountered an error.")
        exit_event.set()

exit_event = threading.Event()

def safe_run(func):
    def wrapper(*args, **kwargs):
        try:
            func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Exception in {func.__name__}: {e}")
            notify("Raphael Error", f"Exception in {func.__name__}: {e}")
            exit_event.set()
    return wrapper

@safe_run
def run_flask_safe():
    run_flask()

@safe_run
def start_key_listener_safe():
    start_key_listener()

if __name__ == '__main__':
    # 初始化注册表
    initialize_registry()

    # 启动 Flask 应用线程
    flask_thread = threading.Thread(target=run_flask_safe)
    flask_thread.daemon = True
    flask_thread.start()

    # 启动快捷键监听线程
    key_listener_thread = threading.Thread(target=start_key_listener_safe)
    key_listener_thread.daemon = True
    key_listener_thread.start()

    # 启动系统托盘
    try:
        create_tray()
    except KeyboardInterrupt:
        logger.info("Shutting down Raphael.")
        exit_event.set()
        sys.exit()
