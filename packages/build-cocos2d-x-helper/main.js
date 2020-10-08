'use strict';
const path = require('path');
const fs = require('fs');
const process = require('child_process');

const delDir = function (path) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach((file, index) => {
      let curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) {
        delDir(curPath); //递归删除文件夹
      } else {
        fs.unlinkSync(curPath); //删除文件
      }
    });
    fs.rmdirSync(path);  // 删除文件夹自身
  }
}

const copyFiles = function (srcPath, tarPath, filter = []) {
  fs.readdir(srcPath, function (err, files) {
    log(files)
    if (err === null) {
      // 创建文件夹
      fs.mkdir(tarPath, (err) => { });

      files.forEach(function (filename) {
        let filedir = path.join(srcPath, filename);
        let filterFlag = filter.some(item => item === filename)
        if (!filterFlag) {
          fs.stat(filedir, function (errs, stats) {
            let isFile = stats.isFile()
            if (isFile) {// 复制文件
              const destPath = path.join(tarPath, filename);
              fs.copyFile(filedir, destPath, (err) => { })
            } else {// 创建文件夹
              let tarFiledir = path.join(tarPath, filename);
              fs.mkdir(tarFiledir, (err) => { });
              copyFiles(filedir, tarFiledir, filter)// 递归
            }
          })
        }
      })
    } else {
      if (err) error(err);
    }
  })
}

const copyFile = function (srcPath, tarPath) {
  log(srcPath, tarPath);
  fs.copyFile(srcPath, tarPath, (err) => { })
}

const mkdirsSync = function (dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}

const jsbAutoBindGen = async function () {
  await new Promise(function (resolve, reject) {
    process.exec('cd ' + path.resolve(__dirname, '../../tools') + '&& python jsb_auto_bind.py', function (err) {
      if (err == null) {
        resolve();
        log("Successfully generated jsb automatic binding code.");
      } else {
        log(err)
        reject();
        log("An error occurred during the process of generating jsb automatic binding code.")
      }
    })
  })
}

const log = function (info) {
  if (Editor) {
    Editor.log(info);
  } else {
    console.log(info);
  }
}

const error = function () {
  if (Editor) {
    Editor.error(info);
  } else {
    console.error(info);
  }
}

function onStartBuild(options, callback) {
  (async () => {
    let pdir = Editor ? path.resolve(__dirname, '../../') : path.resolve('../');//当关闭编辑器时，没有Editor相关的信息，这时候使用tools下的命令行工具打包，采用后面的路径
    let srcSubDir = pdir + '/custom_engine/cocos2d-x', distSubDir = pdir + '/build-templates/jsb-default/frameworks/cocos2d-x', distSubDir2 = pdir + '/build-templates/jsb-default/frameworks/runtime-src/Classes';
    let ignoreList = ['.gitignore'];

    log("Start generate jsb auto bind codes.");
    await jsbAutoBindGen();

    //清除旧文件夹子
    log('Start clean old Cocos2d-x engine folders.');
    delDir(pdir + '/build/jsb-default/frameworks/cocos2d-x');
    delDir(distSubDir);
    delDir(distSubDir2);

    //创建相关文件夹
    log('Start create Cocos2d-x engine build templates folders.');
    mkdirsSync(distSubDir);
    mkdirsSync(distSubDir2);

    //拷贝引擎部分
    log('Start copy Cocos2d-x engine to build templates folder.');
    copyFiles(srcSubDir + '/build', distSubDir + '/build', ignoreList);
    copyFiles(srcSubDir + '/cocos', distSubDir + '/cocos', ignoreList);
    copyFiles(srcSubDir + '/extensions', distSubDir + '/extensions', ignoreList);
    copyFiles(srcSubDir + '/external', distSubDir + '/external', ignoreList);

    //拷贝JSB绑定模块注册文件
    log('Start copy jsb moudle register files to build templates folder.');
    copyFile(srcSubDir + '/cocos/scripting/js-bindings/manual/jsb_module_register.cpp', distSubDir2 + '/jsb_module_register.cpp');
    callback && callback();
  })();
}

module.exports = {
  load() {
    Editor.Builder.on('build-start', onStartBuild);
  },

  unload() {
    Editor.Builder.removeListener('build-start', onStartBuild);
  }
};