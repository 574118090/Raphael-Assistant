# run.spec

from PyInstaller.utils.hooks import collect_data_files
import os

# 设置 PyInstaller 配置
a = Analysis(
    ['run.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        # 包括 app 文件夹下的所有文件
        ('app/static', 'app/static'),
        ('app/templates', 'app/templates'),
        ('app/__init__.py', 'app/__init__.py'),
        # 根目录下的 run.py 和 config.py
        ('run.py', 'run.py'),
        ('config.py', 'config.py'),
    ],
    hiddenimports=[],
    hookspath=[],
    runtime_hooks=[],
    excludes=[]
)

# 设置打包的选项
pyz = PYZ(a.pure, a.zipped_data)  # 不使用 BLOCK_CIPHER

# 设置 EXE 生成时的图标
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
    strip=False,
    upx=True,
    console=False,  # 设置为 False 以隐藏命令行窗口
    icon=os.path.join('app', 'static', 'images', 'Raphael.png')  # 设置图标路径
)

# 如果你有更多的资源文件，可以继续使用 collect_data_files 来自动收集资源
# 例如，自动收集 app/static 和 app/templates 中的所有文件
datas = collect_data_files('app')
