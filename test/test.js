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
