## Backbone.Rpc

#### Plugin for using the backbone js library with a remote json-rpc handler instead of the default REST one 

## Introduction
In nearly every javascript developers life, there is a point when you need to work with
rusty old Java devs. This happend to me when I created this plugin.
Instead of using a nice RESTful interface, the backend guys came around with a
json-rpc 2.0 implementation. It was clearly unusable with the default
backbone request handling.

## Usage

```javascript
require(['path/to/publisher'], function (publisher) {
  /* Do stuff with publisher here */
});
```

## License & Getting Involved

The plugin is released under the MIT License. Feel free to add and/or modify
it´s contents. If you
- found a bug
- want to add something nice
- have questions

feel free to contact me.