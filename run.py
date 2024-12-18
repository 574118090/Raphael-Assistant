from app import create_app, db
import logging
import threading
import pystray
from pystray import MenuItem as item
from PIL import Image
import webbrowser
import os
import tkinter as tk
from tkinter import font
import sys
import ctypes
from pynput import keyboard
import winreg

app = create_app()

def create_image():
    icon_path = os.path.join(os.path.dirname(__file__), 'app', 'static', 'images', 'Raphael.png')
    if not os.path.exists(icon_path):
        raise FileNotFoundError(f"图标文件未找到: {icon_path}")
    image = Image.open(icon_path)
    return image

def on_quit(icon, item):
    icon.stop()
    sys.exit()

def open_webpage(icon, item):
    webbrowser.open("http://127.0.0.1:21823")

def on_double_click(icon, mouse_event):
    webbrowser.open("http://127.0.0.1:21823")

def create_font():
    root = tk.Tk()
    root.withdraw()
    return font.nametofont("TkDefaultFont")

def get_shortcut_status():
    try:
        registry = winreg.ConnectRegistry(None, winreg.HKEY_CURRENT_USER)
        key = winreg.OpenKey(registry, r"Software\YourCompany\FlaskApp", 0, winreg.KEY_READ)
        value, _ = winreg.QueryValueEx(key, "EnableShortcuts")
        winreg.CloseKey(key)
        return value == "True"
    except (FileNotFoundError, OSError):
        return True  # Default is enabled

def set_shortcut_status(enable=True):
    try:
        registry = winreg.ConnectRegistry(None, winreg.HKEY_CURRENT_USER)
        key = winreg.OpenKey(registry, r"Software\YourCompany\FlaskApp", 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, "EnableShortcuts", 0, winreg.REG_SZ, "True" if enable else "False")
        winreg.CloseKey(key)
    except Exception as e:
        print(f"设置快捷键状态失败: {e}")

def toggle_shortcut(icon, item):
    current_status = get_shortcut_status()
    set_shortcut_status(not current_status)
    icon.update_menu()

def create_tray():
    icon = pystray.Icon("FlaskApp", create_image(), menu=(
        item("访问网页", open_webpage),
        item("启用快捷键", toggle_shortcut, checked=lambda item: get_shortcut_status()),
        item("退出", on_quit),
    ))
    icon.on_double_click = on_double_click
    icon.run()

def run_flask():
    app.run(host="localhost", port=21823, debug=False)

pressed_keys = set()

def on_press(key):
    try:
        print(f"按下: {key.char}")
        pressed_keys.add(key)
    except AttributeError:
        print(f"按下: {key}")
        pressed_keys.add(key)

    if get_shortcut_status() and (keyboard.Key.alt_l in pressed_keys or keyboard.Key.alt_r in pressed_keys):
        if key == keyboard.KeyCode.from_char('r'):
            print("按下了 Alt + R，打开网页")
            webbrowser.open("http://127.0.0.1:21823")

def on_release(key):
    try:
        pressed_keys.remove(key)
    except AttributeError:
        pressed_keys.remove(key)

    if key == keyboard.Key.esc:
        return False

# 按键监听
def start_key_listener():
    listener = keyboard.Listener(on_press=on_press, on_release=on_release)
    listener.start()

if __name__ == '__main__':
    # 隐藏控制台窗口（Windows专用）
    if sys.platform.startswith('win') and getattr(sys, 'frozen', False):
        ctypes.windll.user32.ShowWindow(ctypes.windll.kernel32.GetConsoleWindow(), 0)

    werkzeug_logger = logging.getLogger('werkzeug')
    werkzeug_logger.setLevel(logging.WARNING)  # 或 logging.ERROR
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # 启动按键监听
    start_key_listener()

    create_tray()
