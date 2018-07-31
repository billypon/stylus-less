## Usage

test.less

```less
@color: black;
```

use plugin for stylus

```javascript
var fs = require('fs');
var stylus = require('stylus');

var str = fs.readFileSync('test.styl', 'utf-8');
stylus(str)
  .set('filename', 'test.styl')
  .use(require('..')())
  .render(function (err, css) {
    if (err) {
      throw err;
    }
    console.log(css);
  });
```

import less in styl file(less ext can be ignored)

```stylus
import-less('test.less')
body
  color $color
```
