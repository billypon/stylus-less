var fs = require('fs');
var path = require('path');
var stylus = require('stylus');
var less = require('less');
var _ = require('lodash');

var fileCache = {}, stylusCache = {};

function readFile(file, cache) {
  file = file.indexOf('.') < 0 ? file + '.less' : file;
  if (fileCache[file]) {
    return fileCache[file];
  }
  var str = fs.readFileSync(file).toString();
  var filePath = path.dirname(file);
  while (str.indexOf('@import') >= 0) {
    str = str.replace(/@import +("([^"]+)"|'([^']+)' *;)/, function () {
      var includeFile = path.resolve(filePath, arguments[2] || arguments[3]);
      return readFile(includeFile);
    });
  }
  if (cache) {
    fileCache[file] = str;
  }
  return str;
}

module.exports = exports = function (options, lessOptions) {
  options = options || {};
  options.prefix = options.prefix !== undefined ? options.prefix : '$';
  options.cache = options.cache === false ? false : true;

  lessOptions = _.defaultsDeep({compress: true}, lessOptions || {});

  return function (_stylus) {
    _stylus.include(__dirname);
    _stylus.define('import-less', function (file) {
      file = file.string;
      if (!file.endsWith('.less')) {
        file += '.less';
      }
      file = stylus.utils.lookup(file, this.options.paths);
      if (!file) {
        return;
      }

      var fn = function (_this, block) {
        var parent = _this.renderer.options.parent;
        block = block.clone(parent);
        block.parent = parent;
        block.scope = false;
        block.push(_this.visit(block));
      }

      file = path.resolve(file);
      if (!stylusCache[file]) {
        var str = readFile(file, options.cache);

        var list = str.match(/^@[^:\n]+:[^;]+/gm);
        str += '\n* {\n';
        list.forEach(function (x) {
          var name = x.split(':')[0].substr(1).trim();
          str += 'e("' + name + ':@{' + name + '};");\n';
        });
        str += '}';

        var _this = this;
        less.render(str, lessOptions, function (err, result) {
          if (err) {
            throw err;
          }

          str = '';
          result.css.split(/[;\n{}]/).forEach(function (x) {
            if (x.indexOf(':') < 0) {
              return;
            }
            x = x.split(':');
            if (x[1] === '') {
              return;
            }
            if (options.prefix) {
              str += options.prefix;
            }
            str += x[0] + ' = ' + x[1] + '\n';
          });

          var parser = new stylus.Parser(str, stylus.utils.merge({
            root: new stylus.nodes.Block()
          }), _this.options);
          var block = parser.parse();
          if (options.cache) {
            stylusCache[file] = block;
          }

          fn(_this, block);
        });
      } else {
        var block = stylusCache[file];
        fn(this, block);
      }
    });
  }
}

exports.path = __dirname;
exports.version = require(__dirname + '/package.json').version;
