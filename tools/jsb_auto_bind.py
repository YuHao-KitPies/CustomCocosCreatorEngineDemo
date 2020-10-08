#!/usr/bin/python
# -*- coding: UTF-8 -*-
import os
import platform
import logging
import sys

if sys.version_info.major >= 3:
    logging.warning("Please use python2.7.  ^_^...")
    os._exit(1)

try:
    import yaml # 判断PyYAML是否已经安装，运行生成自动绑定的脚本时需要PyYAML
except ImportError:
    logging.warning("Firstly please use the command 'sudo pip install PyYAML' to install PyYAML.")
    os._exit(1)

try:
    import Cheetah # 判断PyYAML是否已经安装，运行生成自动绑定的脚本时需要PyYAML
except ImportError:
    logging.warning("Secondly please use the command 'sudo pip install Cheetah' to install Cheetah.")
    os._exit(1)

logging.basicConfig(level=logging.DEBUG)

# 检测本地配置文件信息
configFilePath = './jsb-auto-bind-env-config.yaml'
isExist = os.path.exists(configFilePath)
isAFile = os.path.isfile(configFilePath)

if not(isExist and isAFile):
    fd = open(configFilePath, 'wb')
    fd.write("PYTHON_BIN: python path \nNDK_ROOT: android ndk path")
    fd.close()
    logging.info("There is no 'jsb-auto-bind-env-config.yaml' file at local. A 'jsb-auto-bind-env-config.yaml' file has be created. Follow the prompts to customize your local environment path.")
    os._exit(1)
else:
    fd = open(configFilePath, 'r')
    configData = yaml.load(fd, Loader=yaml.FullLoader)
    fd.close()

# 操作系统类型
if platform.system() == "Windows":
     # 导出Python路径
    os.environ['PYTHON_BIN']=configData['PYTHON_BIN']
    # 导出
    os.environ['NDK_ROOT']=configData['NDK_ROOT']
elif platform.system() == "Darwin":
    # 导出Python路径
    os.environ['PYTHON_BIN']=configData['PYTHON_BIN']
    # 导出
    os.environ['NDK_ROOT']=configData['NDK_ROOT']
else:
    logging.warning("The os of of your computer is %s. Sorry. I can not work on this os.", platform.system())
    os._exit(1)

# 删除旧的JSB自动绑定代码
def local_rm(dirpath):
    if os.path.exists(dirpath):
        files = os.listdir(dirpath)
        for file in files:
            filepath = os.path.join(dirpath, file).replace("\\",'/')
            if os.path.isdir(filepath):
                local_rm(filepath)
            else:
                os.remove(filepath)
        os.rmdir(dirpath)
local_rm(os.path.abspath(os.path.join(os.getcwd(), "../custom_engine/cocos2d-x/cocos/scripting/js-bindings/auto")))

# 执行生成JSB自动绑定代码的脚本
os.chdir(os.path.abspath(os.path.join(os.getcwd(), "../custom_engine/cocos2d-x/tools/tojs/")))
os.system("python genbindings.py")