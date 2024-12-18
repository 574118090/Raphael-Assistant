from app import create_app
import logging
import threading
import pystray
from pystray import MenuItem as item
from PIL import Image
import webbrowser
import os
import sys
import ctypes
from pynput import keyboard
import winreg

app = create_app()

def create_image():
    icon_path = os.path.join(os.path.dirname(__file__), 'app', 'static', 'images', 'Raphael.png')
    if not os.path.exists(icon_path):
        raise FileNotFoundError(f"Icon file not found: {icon_path}")
    image = Image.open(icon_path)
    return image

def on_quit(icon, item):
    icon.stop()
    sys.exit()

def open_webpage(icon, item):
    webbrowser.open("http://127.0.0.1:21823")

def on_double_click(icon, mouse_event):
    webbrowser.open("http://127.0.0.1:21823")

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
        print(f"Failed to set shortcut status: {e}")

def toggle_shortcut(icon, item):
    current_status = get_shortcut_status()
    set_shortcut_status(not current_status)
    icon.update_menu()

def create_tray():
    icon = pystray.Icon("FlaskApp", create_image(), menu=(
        item("Open Webpage", open_webpage),
        item("Enable Shortcuts", toggle_shortcut, checked=lambda item: get_shortcut_status()),
        item("Quit", on_quit),
    ))
    icon.on_double_click = on_double_click
    icon.run()

def run_flask():
    app.run(host="localhost", port=21823, debug=False)

# Global key press tracker
pressed_keys = set()

def on_press(key):
    try:
        pressed_keys.add(key)
        if get_shortcut_status() and (keyboard.Key.alt_l in pressed_keys or keyboard.Key.alt_r in pressed_keys):
            if key == keyboard.KeyCode.from_char('r'):
                print("Pressed Alt + R, opening webpage.")
                webbrowser.open("http://127.0.0.1:21823")
    except AttributeError:
        pass

def on_release(key):
    try:
        pressed_keys.remove(key)
    except AttributeError:
        pass

    if key == keyboard.Key.esc:
        return False

def start_key_listener():
    listener = keyboard.Listener(on_press=on_press, on_release=on_release)
    listener.start()

if __name__ == '__main__':

    werkzeug_logger = logging.getLogger('werkzeug')
    werkzeug_logger.setLevel(logging.WARNING)
    
    # Start Flask in a separate thread
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()

    # Start key listener in a separate thread
    key_listener_thread = threading.Thread(target=start_key_listener)
    key_listener_thread.daemon = True
    key_listener_thread.start()

    # Create system tray
    create_tray()
