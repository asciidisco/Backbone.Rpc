## Backbone.Rpc

#### Plugin for using the backbone js library with json-rpc instead of the native REST implementation 

## Build Status

[![Build Status](https://secure.travis-ci.org/asciidisco/Backbone.Rpc.png?branch=master)](http://travis-ci.org/asciidisco/Backbone.Rpc)

## Anotated Source Code && Tests

### Docco docs
[Docs](http://asciidisco.github.com/Backbone.Rpc/docs/backbone.rpc.html)

### QUnit tests
[Tests](http://asciidisco.github.com/Backbone.Rpc/test/index.html)

## Introduction
In nearly every javascript developers life, there is a point when you need to work with
rusty old Java devs. This happend to me when I created this plugin.
Instead of using a nice RESTful interface, the backend guys came around with a
json-rpc 2.0 implementation. It was clearly unusable with the default
backbone request handling.

## Installation

The plugin itself implements the Universal Module Definition (UMD).
You can use it with a CommonJS like loader, or with an AMD loader or via
a vanilla javascript.

The plugin itself has three dependencies, underscore.js, jQuery and backbone.js

You can directly download the 
[Development Version](http://asciidisco.github.com/Backbone.Rpc/docs/backbone.rpc.html)
or the
[Production Version](http://asciidisco.github.com/Backbone.Rpc/docs/backbone.rpc.html)
from the root folder

### AMD
```javascript
// AMD
require(['path/to/backbone.rpc'], function (Backbone) {
  /* Do stuff with Backbone here */
});
```

### CommonJS
```javascript
// CommonJS
var Backbone = require('path/to/backbone.rpc');
```

### Vanilla JS
```html
<!-- Vanilla javascript -->
<script src="path/to/jquery.js"></script>
<script src="path/to/underscore.js"></script>
<script src="path/to/backbone.js"></script>
<script src="path/to/backbone.rpc.js"></script>
<script>
	console.log(Backbone.Rpc); // Backbone and the Rpc property are globals
</script>
```

## License
Copyright (c) Sebastian Golasch 2012

The plugin is released under the MIT License. Feel free to add and/or modify
it´s contents. If you<br />
- found a bug<br />
- want to add something nice<br />
- have questions<br />

feel free to contact me.