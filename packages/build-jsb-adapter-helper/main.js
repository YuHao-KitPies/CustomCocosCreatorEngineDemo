'use strict';
const a = require('aliasify');
const e = require('path');
const i = require('fs');
const n = require('gulp');
const r = require('browserify');
const o = require('vinyl-buffer');
const s = require('vinyl-source-stream/index');
const t = require('babelify');
const u = /[Ww]eb[Vv]iew/;

function b(e, i) {
  return n.src(e).pipe(n.dest(i))
}

function d(i, l, d) {
  let b = e.basename(l);
  let c = function (e) {
    return !!e && e.some(e => /.*jsb-webview(\.js)?/.test(e))
  }(d);
  l = e.dirname(l);
  let j = r(i);
  return d && d.forEach(function (e) {
    j.exclude(e)
  }),
    j = j.transform(t, {
      presets: [require("@babel/preset-env")]
    }),
    c && (j = j.transform(a, {
      replacements: { ".*jsb-webview(.js)?": !1 },
      verbose: !1
    })),
    j.bundle().pipe(s(b)).pipe(o()).on("data", function (e) {
      if (c) {
        let i = e.contents.toString();
        if (u.test(i)) throw new Error("WebView field still exists in jsb-adapter")
      }
    }).pipe(n.dest(l))
}

function l(n, t) {
  if (!i.existsSync(t))
    return !0;
  let r = i.statSync(t);
  return function n(t, r) {
    return i.readdirSync(t).some(s => {
      let o = e.join(t, s), a = i.statSync(o);
      return a.isDirectory() ? n(o, r) : a.mtime.getTime() > r || void 0
    })
  }(e.dirname(n), r.mtime.getTime())
}

async function prebuild(i) {
  let { rootPath: n, dstPath: t } = i;
  if (!n) throw new Error("Please specify the jsbAdapter path");
  console.time("build jsb-adapter");
  await new Promise(i => {
    let r = e.join(n, "./builtin/index.js");
    let s = e.join(t, "./jsb-builtin.js");
    l(r, s) ? d(r, s).on("end", i) : i();
  });
  await new Promise(i => {
    let r = e.join(n, "./engine/index.js");
    let s = e.join(t, "./jsb-engine.js");
    l(r, s) ? d(r, s).on("end", i) : i();
  });
  console.timeEnd("build jsb-adapter");
}

async function build(i) {
  let { rootPath: n, dstPath: t, excludedModules: r, pdir: pdir} = i;
  if (!n) throw new Error("Please specify the jsbAdapter path");
  console.time("build jsb-adapter");
  await new Promise(i => {
    b(e.join(n, "./bin/jsb-builtin.js"), t).on("end", i)
  });
  await new Promise(i => {
    if (r && r.length > 0) {
      let s = [], o = require(pdir + "/custom_engine/jsb-adapter/modules.json");
      r.forEach(function (i) {
        o.some(function (t) {
          if (t.name === i && t.entries)
            return t.entries.forEach(
              function (i) {
                s.push(e.join(n, i))
              }), !0
        })
      });
      d(e.join(n, "./engine/index.js"), e.join(t, "./jsb-engine.js"), s).on("end", i);
    } else b(e.join(n, "./bin/jsb-engine.js"), t).on("end", i)
  });
  console.timeEnd("build jsb-adapter")
}

async function buildJSBAdapter(excludedModules) {
  let pdir = Editor?e.resolve(__dirname, '../../'):e.resolve('../');//当关闭编辑器时，没有Editor相关的信息，这时候使用tools下的命令行工具打包，采用后面的路径
  await prebuild({
    rootPath: pdir + '/custom_engine/jsb-adapter',
    dstPath: pdir + '/custom_engine/jsb-adapter/bin',
  });
  await build({
    rootPath: pdir + '/custom_engine/jsb-adapter',
    dstPath: pdir + '/build-templates/jsb-default/jsb-adapter',
    excludedModules: excludedModules,
    pdir: pdir
  });
}

function onStartBuild(options, callback) {
  (async () => {
    await buildJSBAdapter(options.excludedModules);
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