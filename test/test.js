var assert = require('assert');

var stylus = require('stylus');

var file = 'test.styl';
var fs = require('fs');
var str = fs.readFileSync(file, 'utf-8');

it('import', function () {
  stylus(str)
    .set('filename', file)
    .use(require('..')())
    .render(function (err, css) {
      if (err) {
        throw err;
      }
      assert.equal(true, css.indexOf('$color') < 0);
    });
});

it('global vars', function () {
  stylus(str)
    .set('filename', file)
    .use(require('..')({
      cache: false,
      less: {
        globalVars: {
          background: '#000'
        }
      }
    }))
    .render(function (err, css) {
      if (err) {
        throw err;
      }
      assert.equal(true, css.indexOf('$background') < 0);
    });
});

it('modify vars', function () {
  stylus(str)
    .set('filename', file)
    .use(require('..')({
      cache: false,
      less: {
        modifyVars: {
          color: '#fff'
        }
      }
    }))
    .render(function (err, css) {
      if (err) {
        throw err;
      }
      assert.equal(true, css.indexOf('#fff') > 0);
    });
});

it('render stylus', function () {
  var _str = fs.readFileSync('test.less', 'utf-8');
  require('..').render(_str, { cache: false }, function (err, styl) {
    if (err) {
      throw err;
    }
    assert.equal(true, styl.indexOf('=') > 0);
  });
});
