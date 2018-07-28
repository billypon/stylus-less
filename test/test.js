var assert = require('assert');

var fs = require('fs');
var stylus = require('stylus');

it('import', function () {
  var str = fs.readFileSync('test.styl').toString();
  stylus(str)
    .set('filename', 'test.styl')
    .use(require('..')())
    .render(function (err, css) {
      if (err) {
        throw err;
      }
      assert.equal(true, css.indexOf('$color') < 0);
    });
});

it('import without less options', function () {
  var str = fs.readFileSync('test.styl').toString();
  stylus(str)
    .set('filename', 'test.styl')
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
