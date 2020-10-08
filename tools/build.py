#!/usr/bin/python
# -*- coding: UTF-8 -*-
import os
import platform
import logging
import sys
logging.basicConfig(level=logging.DEBUG)

if sys.version_info.major >= 3:
    logging.warning("Please use python2.7.  ^_^...")
    os._exit(1)

# 操作系统类型
if platform.system() == "Windows":
    defaultEnginePath = "CocosCreator/CocosCreator.exe"
elif platform.system() == "Darwin":
    defaultEnginePath = "/Applications/CocosCreator/CocosCreator.app/Contents/MacOS/CocosCreator"
else:
    logging.warning("The os of of your computer is %s. Sorry. I can not work on this os.", platform.system())
    os._exit(1)


# 检测本地配置文件信息
configFilePath = './.build-config'
isExist = os.path.exists(configFilePath)
isAFile = os.path.isfile(configFilePath)

if not(isExist and isAFile):
    fd = open(configFilePath, 'wb')
    fd.write(defaultEnginePath)
    realEnginePath = defaultEnginePath
    logging.info("There is no '.build-config' file at local. A '.build-config' file has be created. Custom your Cocos Creator engine path in this file.")
else:
    fd = open(configFilePath, 'r')
    realEnginePath = fd.readline()

fd.close()

logging.info("The real engine path is '%s'.", realEnginePath)

# 构建JSB Adapter，使用扩展包build-jsb-adapter-helper执行
logging.info("Start build and copy jsb adapter codes.")

# 执行常规的构建流程，--build如果没有指定参数，则会使用 Creator 中构建面板当前的平台、模板等设置(settings中的builder.json和project.json中的设置信息)来作为默认参数。如果指定了其他参数设置，则会使用指定的参数来覆盖默认参数
os.system(realEnginePath + ' --path "../" --build "platform=ios;template=default;"')

#提示：也可以使用编辑器的构建发布功能进行构建，其执行流程与此流程一致