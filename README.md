## Backbone.Rpc
Plugin for using the backbone js library with json-rpc instead of the native REST implementation

## Build Status, Project Page, Annotated Source & Tests
[![Build Status](https://secure.travis-ci.org/asciidisco/Backbone.Rpc.png?branch=master)](http://travis-ci.org/asciidisco/Backbone.Rpc)<br /><br />
[Project Page](http://asciidisco.github.com/Backbone.Rpc/index.html)<br />
[Docs](http://asciidisco.github.com/Backbone.Rpc/docs/backbone.rpc.html)<br />
[Tests](http://asciidisco.github.com/Backbone.Rpc/test/index.html)<br />
[NPM registry](http://search.npmjs.org/#/Backbone.Rpc)


## Introduction
In nearly every javascript developers life, there is a point when you need to work with
rusty old Java devs. This happend to me when I created this plugin.
Instead of using a nice RESTful interface, the backend guys came around with a
json-rpc 2.0 implementation. It was clearly unusable with the default
backbone request handling. So this little piece of software was the outcome
of my will to use Backbone.

## Installation

The plugin itself implements the Universal Module Definition (UMD).
You can use it with a CommonJS like loader, or with an AMD loader or via
vanilla javascript.

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
### NPM
```shell
$ npm install Backbone.Rpc
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
var DeviceModel = Backbone.Model.extend({
	url: 'path/to/my/rpc/handler',
	rpc: new Backbone.Rpc(),
	methods: {
	    read            : ['getFilteredDevicesById', 'id'],
	    create          : ['addDevice', 'name'],
	    remove          : ['deleteDevice', 'id'],
	    update          : ['setDeviceName', 'id', 'name'],
	    addDeviceToRoom : ['setRoomForDevice' , 'id', 'roomId']
	}
});
```

Here we have five methods. The first four (read, create, remove, update) will be mapped
to the corresponding Backbone methods.

Example:

```javascript
deviceModel.fetch(); 			// Calls 'read'
deviceModel.save(); 			// Calls 'create'
deviceModel.save({id: 12}); 	// Calls 'update'
deviceModel.destroy(); 			// Calls 'remove'
```

But what will happen to the 'addDeviceToRoom' method?
You can call it directly!

```javascript
deviceModel.addDeviceToRoom(); // Calls 'addDeviceToRoom'

// This methods acts like all the other methods, so you can use options:
deviceModel.addDeviceToRoom({success: function { ... }, error: function () { ... }});

// And you can bind events
deviceModel.bind('called:addDeviceRoom', function () { ... });
```

### Adding params to the methods
You might wonder what that snd. array entry 'id' in our 'read' method is?!

```javascript
read: ['getFilteredDevicesById', 'id'],
```
It´s a placeholder for a param property.
If we take a closer look at the Request from the 'Basic Usage' example,
we see an empty params array.

```javascript
{"jsonrpc":"2.0","method":"getRandomTextSnippet","id":"1331724849238","params":[]}:
```

If we now do the following and take a look at the request, our current example creates,
we see what this will change:

```javascript
deviceModel.set({id: 14});
deviceModel.fetch(); // Calls 'read'

// Request created by the 'read' call
{"jsonrpc":"2.0","method":"getFilteredDevicesById","id":"1331724849298","params":["14"]}:
```
Hopefully you noticed that the contents of the 'id' attribute are applied as part of the
params array in the response.

As seen in the update call, you can add as many as params as you like:

```javascript
update: ['setDeviceName', 'id', 'name']
```

### Fire multiple RPC calls with one method call
Sometimes we need to do more then one remote method call when we operate on an entity.
Using our device example, we can say that every time a device will be created we need
to reset the server side device cache.

Sure we could accomplish that by adding an 'invalidateCache' method to our model
and calling it manually, every time a device will be updated. But that´s error prone.
Luckily, we have a simple pattern to accomplish this.

```javascript
var DeviceModel = Backbone.Model.extend({
	url: 'path/to/my/rpc/handler',
	rpc: new Backbone.Rpc(),
	methods: {
		// ...
	    create: [
	    	['addDevice', 'name'],
	    	['invalidateCache']
	    ]
	    // ...
	}
});

var deviceModel = new DeviceModel();
deviceModel.save({name: 'My new device'});
```
This results in two simultanious POST requests against the rpc handler.

```javascript
// Creates the device
{"jsonrpc":"2.0","method":"addDevice","id":"1331724850010","params":["My new device"]}:

// Invalidates the cache
{"jsonrpc":"2.0","method":"invalidateCache","id":"1331724850020","params":[]}:
```

### Dynamicly created request methods
Lets stick with the multiple RPC call example a bit.
Maybe you wan´t to only invalidate the Server cache under specific circumstances.
To keep it´simple, only when the 'invalidate' attribute in the model is true.
Mhhh... seems tricky?!

Functions to the rescue:

```javascript
var DeviceModel = Backbone.Model.extend({
	url: 'path/to/my/rpc/handler',
	rpc: new Backbone.Rpc(),
	methods: {
	    create: function (changedAttributes, options) {
	    	var methodsToCall = [];
	    	// we always wan´t to change the name
	    	methodsToCall.push(['addDevice', 'name']);
	    	// check if we should invalidate the cache
	    	if (this.get('invalidate') === true) {
	    		methodsToCall.push(['invalidateCache']);
	    		// reset the invalidation flag
	    		this.set({invalidate: false});
	    	}

	    	return  methodsToCall;
	    }
	},
	defaults: {
		invalidate: false
	}
}
});

// does not invalidate cache
var deviceModelOne = new DeviceModel();
deviceModelOne.save({name: 'My fst. new device'});

// invalidates
var deviceModelTwo = new DeviceModel();
deviceModelTwo.save({name: 'My snd. new device', invalidate: true});

// again does not invalidate the cache
var deviceModelThree = new DeviceModel();
deviceModelThree.save({name: 'My thr. new device'});
```
You get the idea...

### Parsers
After all this fetching and calling methods, you might wonder what happens
with the return value of remotly invoked functions that are not mapped to the 'read'
method?! Short answer: Nothing.

Lets change that.

```javascript
var DeviceModel = Backbone.Model.extend({
	url: 'path/to/my/rpc/handler',
	rpc: new Backbone.Rpc(),
	methods: {
	    addDeviceToRoom : ['setRoomForDevice' , 'id', 'roomId']
	},
	parsers: {
		addDeviceToRoom: function (model, result) {
			console.log(resutl); // {roomName: 'Living Room'}
			if (result.roomName) {
				model.set({roomName: result.roomName});
			}
		}
	}
});

var deviceModelThree = new DeviceModel();
deviceModel.set({id: 10, roomId: 12});
deviceModel.addDeviceToRoom({success: function () {
	deviceModel.get('roomName'); // 'Living Room'
}});

```

### Collections
You can add the Rpc functionality to Collections.
Be aware that only fetching / reading makes sense there (My opinion, proof me wrong).

```javascript
var Devices = Backbone.Collection.extend({
	url: 'path/to/my/rpc/handler',
	rpc: new Backbone.Rpc(),
	model: Device,
	methods: {
	    read : ['getDevices']
	}
});

var devices = new Devices();
devices.fetch();
```

You can add dynamic arguments in Collections by referencing object properties

```javascript
var Devices = Backbone.Collection.extend({
	url: 'path/to/my/rpc/handler',
	namespace: 'MeNotJava',
	rpc: new Backbone.Rpc(),
	model: Device,
	arg1: 'hello',
	arg2: function () { return 'world' },
	methods: {
	    read : ['getDevices', 'arg1', 'arg2', 'arg3']
	}
});

var devices = new Devices();
devices.fetch();
```

This call results in the following RPC request:

```javascript
{"jsonrpc":"2.0","method":"MeNotJava/getDevices","id":"1331724850010","params":["hello", "world", "arg3"]}:
```


### Content-Type
The default content type of requests is 'application/json'
You can override it like this:

```javascript
// ...
rpc: new Backbone.Rpc({
    contentType: 'application/json'
})
//...
```

### Namespaces
Most of the time, you´re in need to call methods within a namespace.
No worries, we thought of that too.

```javascript
var TextModel = Backbone.Model.extend({
	namespace: 'MySuperEnterprisyNamespace',
	url: 'path/to/my/rpc/handler',
	rpc: new Backbone.Rpc(),
	methods: {
		read:  ['getRandomTextSnippet']
	}
});

// Fetch a random text snippet
var textModel = new TextModel();
textModel.fetch();

// Will fire this request
{"jsonrpc":"2.0","method":"MySuperEnterprisyNamespace/getRandomTextSnippet","id":"1331724850010","params":[]}:
```

By the way, you´re not tied to the default namespace separator, you can add you´re
own easily:

 ```javascript
var TextModel = Backbone.Model.extend({
	namespace: 'MySuperEnterprisyNamespace',
	url: 'path/to/my/rpc/handler',
	rpc: new Backbone.Rpc({
		namespaceDelimiter: '::'
	}),
	methods: {
		read:  ['getRandomTextSnippet']
	}
});

// Fetch a random text snippet
var textModel = new TextModel();
textModel.fetch();

// Will fire this request
{"jsonrpc":"2.0","method":"MySuperEnterprisyNamespace::getRandomTextSnippet","id":"1331724850010","params":[]}:
```

Nice, hah?!

### Exceptions
When working with a JSON RPC Service you can encounter different types of errors.
The default error handler simply throws if something bad happens.

##### We have a predefined list of errors:

+ 404: {code: -1, message: '404'}
+ 500: {code: -2, message: '500'}
+ typeMissmatch: {code: -3, message: 'Type missmatch'}
+ badResponseId: {code: -4, message: 'Bad response ID'}
+ noResponse: {code: -5, message: 'No response'}

Also, there´s always the possibility for setting custom errors.
Due to the spec, this is done via an error property in the json response
instead of an result property. Backbone.Rpc recognizes that errors and
then triggers the error handler (as said, default one throws).

To prevent Backbone.Rpc from throwing errors, you can add you´re custom
error handler.

 ```javascript
var TextModel = Backbone.Model.extend({
	url: 'path/to/my/rpc/handler',
	rpc: new Backbone.Rpc({
		errorHandler: function (error) {
			console.log('Code: ' + error.code + ' Message: ' + error.message);
		}
	}),
	methods: {
		read:  ['getRandomTextSnippet']
	}
});
```

## Changelog

### 0.1.2
+ Grunt fixes
+ REST can now be used along with this plugin (Fixes #1)
+ Collections can now have dynamic arguments in calls (Fixes #4)
+ README improvements
+ More tests

### 0.1.1
+ Switch build system from cake to grunt
+ Cleaned up
+ Fixed #3 - Content type defaults to 'application/json' & can now be overriden
+ Fixed #5 - README fixes & improvments
+ Inline doc improvements

### 0.1.0
+ Initial Release

## License
Copyright (c) Sebastian Golasch ([@asciidisco](https://twitter.com/#!/asciidisco)) 2012

The plugin is released under the MIT License. Feel free to add and/or modify
it´s contents. Feel free to contact me if you have any questions.