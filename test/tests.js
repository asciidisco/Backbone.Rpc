
var server;

module('Backbone.Rpc', {
  setup: function () {
    this.url = '/fake/server/mock';
    this.contentType = { "Content-Type": "application/json" };
    this.method = 'POST';
    this.errors = [];
    this.errorCallback =null;
    var oldLogError = sinon.logError;
    sinon.logError = _.bind(function () {
      this.errors.push(arguments);
      if (_.isFunction(this.errorCallback)) {
        this.errorCallback(arguments);
      }
    }, this);    
  } 
});

test("initialize", function () {
  expect(1);
  this.errors = [];
  var rpc = new Backbone.Rpc();
  ok(rpc instanceof Backbone.Rpc, 'Backbone.Rpc instance created')
});

test("can fetch simple data", function () {
  expect(1);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        methods: {
          read: ['getAllNumbers']
        }
    });
  var modelInstance = new Model();
  var successCb = function (model) {
    // assert list of numbers
    deepEqual(modelInstance.get('numbers'), [1, 2, 3, 4, 5]);
  };

  // fetch the mocked data
  modelInstance.fetch({success: successCb});

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + modelInstance.rpc.responseID + ', "jsonrpc": "2.0",  "result": {"numbers": [1, 2, 3, 4, 5]} }']);

  //fire response
  server.respond();
  server.restore();
});

test("can delete simple data", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        methods: {
          remove:  ['deleteText', 'id']
        }
    });
  var modelInstance = new Model({id: 1, text: 'To be deleted'});
  var successCb = function (model, result) {
    ok(model === modelInstance, 'Object stays the same in memory');
    ok(result, 'Server responded with true (delete successfull)');
  };

  // fetch the mocked data
  modelInstance.destroy({success: successCb});

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + modelInstance.rpc.responseID + ', "jsonrpc": "2.0", "result": true}']);

  //fire response
  server.respond();
  server.restore();    
});

test("can save simple data", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        methods: {
          create:  ['createText']
        }
    });
  var modelInstance = new Model();
  var successCb = function (model, result) {
    ok(model === modelInstance, 'Object stays the same in memory');
    ok(result, 'Server responded with true (save successfull)');
  };

  // fetch the mocked data
  modelInstance.save({text: 'To be saved'}, {success: successCb, error: successCb});

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + modelInstance.rpc.responseID + ', "jsonrpc": "2.0", "result": true}']);

  //fire response
  server.respond();
  server.restore();    
});

test("can update simple data", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        methods: {
          update:  ['updateText', 'id', 'text']
        }
    });
  var modelInstance = new Model({id: 1, text: 'Needs to be changed'});
  var successCb = function (model, result) {
    ok(model === modelInstance, 'Object stays the same in memory');
    ok(result, 'Server responded with true (update successfull)');
  };

  // fetch the mocked data
  modelInstance.save({text: 'Is updated'}, {success: successCb});

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + modelInstance.rpc.responseID + ', "jsonrpc": "2.0", "result": true}']);

  //fire response
  server.respond();
  server.restore();    
});

test("default exception handler throws error", function () {
    expect(1);
    this.errors = [];
    server = sinon.fakeServer.create();
    var Model = Backbone.Model.extend({
          url: this.url,
          rpc: new Backbone.Rpc(),
          methods: {
            read:  ['getDataWithWrongId']
          }
      });
    var modelInstance = new Model();

    this.errorCallback = function (error) {
      equal(error[1], 'Error code: -4 - message: Bad response ID');
    };

    // fetch the mocked data
    modelInstance.fetch();

    // set response
    server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": "abcdefg", "jsonrpc": "2.0", "result": true}']);

    //fire response
    server.respond();
    server.restore();
});

test("can add custom exception handler", function () {
  expect(3);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc({exceptionHandler: function (exception) {
          ok(true, 'Exception handler called');
          equal(exception.code, -4, 'Exception code can be accessed');
          equal(exception.message, 'Bad response ID', 'Exception message can be accessed');
        }}),
        methods: {
          read:  ['getDataWithWrongId']
        }
    });
  var modelInstance = new Model();

  // fetch the mocked data
  modelInstance.fetch();

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": "abcdefg", "jsonrpc": "2.0", "result": true}']);

  //fire response
  server.respond();
  server.restore();    
});

test("throws exception if bad response id is given", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc({exceptionHandler: function (exception) {
          equal(exception.code, -4, 'Exception code is correct');
          equal(exception.message, 'Bad response ID', 'Default message is correct');
        }}),
        methods: {
          read:  ['getDataWithWrongId']
        }
    });
  var modelInstance = new Model();

  // fetch the mocked data
  modelInstance.fetch();

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": "abcdefg", "jsonrpc": "2.0", "result": true}']);

  //fire response
  server.respond();
  server.restore();    
});