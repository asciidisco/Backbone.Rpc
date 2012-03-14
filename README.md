## Backbone.Rpc
Plugin for using the backbone js library with json-rpc instead of the native REST implementation 

## Build Status, Anotated Source Code & Tests
[![Build Status](https://secure.travis-ci.org/asciidisco/Backbone.Rpc.png?branch=master)](http://travis-ci.org/asciidisco/Backbone.Rpc)<br />
[Project Page](http://asciidisco.github.com/Backbone.Rpc/index.html)<br />
[Docs](http://asciidisco.github.com/Backbone.Rpc/docs/backbone.rpc.html)<br />
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
[Development Version](https://raw.github.com/asciidisco/Backbone.Rpc/master/backbone.rpc.js)
or the
[Production Version](https://raw.github.com/asciidisco/Backbone.Rpc/master/backbone.rpc.min.js)
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

## Usage

### Basic usage
```javascript
var TextModel = Backbone.Model.extend({
	url: 'path/to/my/rpc/handler',
	rpc: new Backbone.Rpc(),
	methods: {
		read:  ['getRandomTextSnippet']
	}
});

// server will respond on calling the 'getRandomTextSnippet' method
// with the following data:
// {id: 12, headline: 'A remote headline', text: 'Loaded remotly'}

var textModel = new TextModel();
textmodel.fetch({success: function () {
	textmodel.get('text'); //= 'Loaded remotly'
	textmodel.get('id'); //= 12
	textmodel.get('headline'); //= 'A remote headline'
}});

```

So, what happend here?!

We added a new Backbone.Rpc instance as an indicator, that this model will use
the Backbone.Rpc.Sync function to communicate with the Server.

```javascript
rpc: new Backbone.Rpc(),
```

Then, we told the Rpc plugin that we wan´t to map the Backbones fetch method
to the remote method 'getRandomTextSnippet':

```javascript
methods: {
	read:  ['getRandomTextSnippet']
}
```

This results in the following POST Request:

```javascript
{"jsonrpc":"2.0","method":"getRandomTextSnippet","id":"1331724849238","params":[]}:
```

According to the JSON RPC Version 2 Specs, the Server will respond
with something like this:

```javascript
{"id":"1331724849238","result":{"id": "12", "headline": "A remote headline", "text": "Loaded remotly"},"jsonrpc":"2.0"}
```

Backbone.Rpc will now take this Response and convert it to smth. Backbones "normal"
response parser and model attribute mapping engine can understand.

### Mapping more then one method

If you have more then one method to map (e.g. complete CRUD plus some other stuff)
you can define them as follows:

```javascript
var TextModel = Backbone.Model.extend({
	url: 'path/to/my/rpc/handler',
	rpc: new Backbone.Rpc(),
	methods: {
	    read            : ['getFilteredDevicesById', 'id'],
	    create          : ['addDevice', 'Name'],
	    remove          : ['deleteDevice', 'id'],
	    update          : ['setDeviceName', 'id', 'Name'],
	    addDeviceToRoom : ['setRoomForDevice' , 'id', 'roomId']
	}
});
```

Here we have five methods. The first four (read, create, remove, update) will be mapped
to the corresponding Backbone methods.

Example:

```javascript
textmodel.fetch(); // Calls 'read'
textmodel.save(); // Calls 'create'
textmodel.save({id: 12}); // Calls 'update'
textmodel.destroy(); // Calls 'remove'
```



## License
Copyright (c) Sebastian Golasch (@asciidisco) 2012

The plugin is released under the MIT License. Feel free to add and/or modify
it´s contents. Feel free to contact me if you have any questions.