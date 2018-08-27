var fs = require('fs');
var path = require('path');
var stylus = require('stylus');
var less = require('less');
var _ = require('lodash');

var fileCache = {}, stylusCache = {};

function readFile(file, cache) {
  file = file.indexOf('.') < 0 ? file + '.less' : file;
  if (cache && fileCache[file]) {
    return fileCache[file];
  }
  var str = fs.readFileSync(file, 'utf-8');
  var filePath = path.dirname(file);
  while (str.indexOf('@import') >= 0) {
    str = str.replace(/@import +("([^"]+)"|'([^']+)' *;)/, function () {
      var includeFile = path.resolve(filePath, arguments[2] || arguments[3]);
      return readFile(includeFile, cache);
    });
  }
  if (cache) {
    fileCache[file] = str;
  }
  return str;
}

function lookupFile(file, paths) {
  var utils = stylus.utils;
  return file.endsWith('.less') ? utils.lookup(file, paths) :
    utils.lookup(file + '.less', paths) || utils.lookup(path.resolve(file + '/', 'index.less'), paths);
}

function handler(ctx, block) {
  var parent = ctx.renderer.options.parent;
  block = block.clone(parent);
  block.parent = parent;
  block.scope = false;
  block.push(ctx.visit(block));
}

function render(str, options, callback) {
  options = options || {};
  options.prefix = options.prefix !== undefined ? options.prefix : '$';
  options.less = _.defaultsDeep({compress: true}, options.less || {});

  var list = str.match(/^@[^:\n]+:[^;]+/gm);
  str += '\n* {\n';
  list.forEach(function (x) {
    var name = x.split(':')[0].substr(1).trim();
    str += 'e("' + name + ':@{' + name + '};");\n';
  });
  ['global', 'modify'].forEach(function (i) {
    for (var x in options.less[i + 'Vars']) {
      if (str.indexOf('"' + x + ':') > 0) {
        continue;
      }
      str += 'e("' + x + ':' + options.less[i + 'Vars'][x] + ';");\n';
    }
  });
  str += '}';

  var ctx = this;
  less.render(str, options.less, function (err, result) {
    if (err) {
      return callback.call(ctx, err);
    }

    var styl = '';
    result.css.split(/[;\n{}]/).forEach(function (x) {
      if (x.indexOf(':') < 0) {
        return;
      }
      x = x.split(':');
      if (x[1] === '') {
        return;
      }
      if (options.prefix) {
        styl += options.prefix;
      }
      styl += x[0] + ' = ' + x[1] + '\n';
    });

    callback.call(ctx, undefined, styl);
  });
}

module.exports = exports = function (options) {
  options = options || {};
  options.cache = options.cache === false ? false : true;
  return function (_stylus) {
    _stylus.include(__dirname);
    _stylus.define('import-less', function (file) {
      file = file.string;
      file = lookupFile(file, this.options.paths);
      if (!file) {
        return;
      }

      file = path.resolve(file);
      if (options.cache && stylusCache[file]) {
        var block = stylusCache[file];
        handler(this, block);
        return;
      }
      var str = readFile(file, options.cache);

      render.call(this, str, options, function (err, styl) {
        if (err) {
          throw err;
        }

        var parser = new stylus.Parser(styl, stylus.utils.merge({
          root: new stylus.nodes.Block()
        }), this.options);
        var block = parser.parse();
        if (options.cache) {
          stylusCache[file] = block;
        }

        handler(this, block);
      });
    });
  }
}

exports.render = render;

exports.path = __dirname;
exports.version = require(__dirname + '/package.json').version;
