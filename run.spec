# run.spec

from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import os

# Collect all data files in the 'app' package
app_datas = collect_data_files('app')

# Manually specify additional data files not covered by collect_data_files
additional_datas = [
    ('app/static', 'app/static'),
    ('app/templates', 'app/templates'),
    # You can omit ('app/__init__.py', 'app/__init__.py') since it's part of the package
    # Similarly, run.py and config.py are already included as scripts or modules
]

# Combine all data files
all_datas = app_datas + additional_datas

# Collect all submodules of 'plyer.platforms' to ensure dynamic imports are included
plyer_submodules = collect_submodules('plyer.platforms')

# Collect all submodules of 'pystray' to ensure platform-specific backends are included
pystray_submodules = collect_submodules('pystray')

# Define hidden imports
hidden_imports = [
    'plyer.platforms.win.notification',  # Ensure Windows notification backend is included
    'pystray._win32',                     # pystray Windows backend
    'pystray._darwin',                    # pystray macOS backend (if needed)
    'pystray._xorg',                      # pystray X11 backend (if needed)
    # Add any other hidden imports if necessary
]

# Alternatively, include all submodules collected above
# hidden_imports = plyer_submodules + pystray_submodules

# Initialize PyInstaller Analysis
a = Analysis(
    ['run.py'],                           # Your main script
    pathex=['.'],                         # Path to search for imports
    binaries=[],
    datas=all_datas,                      # Data files to include
    hiddenimports=hidden_imports,         # Hidden imports to include
    hookspath=[],                         # Custom hook paths
    runtime_hooks=[],                     # Runtime hooks
    excludes=[]                           # Exclude any unnecessary modules
)

# Create the PYZ archive
pyz = PYZ(a.pure, a.zipped_data)

# Define the EXE
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='run',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,
    upx=True,
    console=False,  # Hide the console window
    icon=os.path.join('app', 'static', 'images', 'Raphael.ico')  # Use .ico for Windows compatibility
)

# Note:
# - Ensure that 'Raphael.ico' exists in 'app/static/images/'. PyInstaller prefers .ico files for Windows icons.
# - If you're packaging for macOS, you might want to use a .icns file instead and adjust the icon path accordingly.
