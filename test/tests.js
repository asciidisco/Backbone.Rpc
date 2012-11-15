
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

test("can call simple non std. method", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        methods: {
          doSmthNonStandard:  ['doSmthPrettyStrange']
        }
    });
  var modelInstance = new Model();
  var successCb = function (model, result) {
    ok(model === modelInstance, 'Object stays the same in memory');
    ok(result, 'Server responded with true (call successfully executed)');
  };

  // fetch the mocked data
  modelInstance.doSmthNonStandard({success: successCb});

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + modelInstance.rpc.responseID + ', "jsonrpc": "2.0", "result": true}']);

  //fire response
  server.respond();
  server.restore();
});

test("can parse return values of method", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        methods: {
          someStrangeMethod:  ['createStuffWithResult']
        },
        parsers: {
          someStrangeMethod: function (result) {
            this.set({id: result.id, workingOrder: result.wo});
          }
        }
    });
  var modelInstance = new Model();
  var successCb = function (model, result) {
    equal(model.get('workingOrder'), 'abcde');
    equal(model.get('id'), 12);
  };

  // fetch the mocked data
  modelInstance.someStrangeMethod({success: successCb});

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + modelInstance.rpc.responseID + ', "jsonrpc": "2.0", "result": {"id": 12, "wo": "abcde"}}']);

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

test("throws exception if server responds with 404", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc({exceptionHandler: function (exception) {
          equal(exception.code, -1, 'Exception code is correct');
          equal(exception.message, '404', 'Default message is correct');
        }}),
        methods: {
          read:  ['doNothing']
        }
    });
  var modelInstance = new Model();

  // fetch the mocked data
  modelInstance.fetch();

  // set response
  server.respondWith(this.method, this.url, [404, 'text/plain', 'Not found']);

  //fire response
  server.respond();
  server.restore();
});

test("throws exception if server responds with 500", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc({exceptionHandler: function (exception) {
          equal(exception.code, -2, 'Exception code is correct');
          equal(exception.message, '500', 'Default message is correct');
        }}),
        methods: {
          read:  ['doNothing']
        }
    });
  var modelInstance = new Model();

  // fetch the mocked data
  modelInstance.fetch();

  // set response
  server.respondWith(this.method, this.url, [500, 'text/plain', 'Server error']);

  //fire response
  server.respond();
  server.restore();
});

test("throws exception if server sends an empty response", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc({exceptionHandler: function (exception) {
          equal(exception.code, -5, 'Exception code is correct');
          equal(exception.message, 'No response', 'Default message is correct');
        }}),
        methods: {
          read:  ['doNothing']
        }
    });
  var modelInstance = new Model();

  // fetch the mocked data
  modelInstance.fetch();

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType, 'null']);

  //fire response
  server.respond();
  server.restore();
});

test("throws exception if method parameters are in the wrong format", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc({exceptionHandler: function (exception) {
          equal(exception.code,  -3, 'Exception code is correct');
          equal(exception.message, 'Type missmatch', 'Default message is correct');
        }}),
        methods: {
          read: 'doNothing'
        }
    });
  var modelInstance = new Model();

  // fetch the mocked data
  modelInstance.fetch();

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + modelInstance.rpc.responseID + ', "jsonrpc": "2.0", "result": {"id": 12, "wo": "abcde"}}']);

  //fire response
  server.respond();
  server.restore();
});

test("throws exception if error message is blank", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc({exceptionHandler: function (exception) {
          equal(exception.code,  -6, 'Exception code is correct');
          equal(exception.message, 'No error defined', 'Default message is correct');
        }}),
        methods: {
          read: ['doNothing']
        }
    });
  var modelInstance = new Model();

  // fetch the mocked data
  modelInstance.fetch();

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + modelInstance.rpc.responseID + ', "jsonrpc": "2.0", "error": null}']);

  //fire response
  server.respond();
  server.restore();
});

test("can fetch simple data (namespaced)", function () {
  expect(4);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        namespace: 'abcde',
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

  // check if namespace, method call and parameters are correct
  equal(JSON.parse(server.requests[0].requestBody).method, 'abcde/getAllNumbers', 'Method called in the correct namespace');
  equal(JSON.parse(server.requests[0].requestBody).params.length, 0, 'Parameters set correctly');
  equal(JSON.parse(server.requests[0].requestBody).id, modelInstance.rpc.responseID, 'Response id set correctly');

  //fire response
  server.respond();
  server.restore();
});

test("can delete simple data (namespaced)", function () {
  expect(5);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        namespace: 'abcde',
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

  // check if namespace, method call and parameters are correct
  equal(JSON.parse(server.requests[0].requestBody).method, 'abcde/deleteText', 'Method called in the correct namespace');
  equal(JSON.parse(server.requests[0].requestBody).params[0], 1, 'Parameters set correctly');
  equal(JSON.parse(server.requests[0].requestBody).id, modelInstance.rpc.responseID, 'Response id set correctly');

  //fire response
  server.respond();
  server.restore();
});

test("can save simple data (namespaced)", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        namespace: 'abcde',
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

test("can update simple data (namespaced)", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        namespace: 'abcde',
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

test("can call simple non std. method (namespaced)", function () {
  expect(2);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        namespace: 'abcde',
        methods: {
          doSmthNonStandard:  ['doSmthPrettyStrange']
        }
    });
  var modelInstance = new Model();
  var successCb = function (model, result) {
    ok(model === modelInstance, 'Object stays the same in memory');
    ok(result, 'Server responded with true (call successfully executed)');
  };

  // fetch the mocked data
  modelInstance.doSmthNonStandard({success: successCb});

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + modelInstance.rpc.responseID + ', "jsonrpc": "2.0", "result": true}']);

  //fire response
  server.respond();
  server.restore();
});

test("can operate multiple methods", function () {
  expect(2);
  var xhr = sinon.useFakeXMLHttpRequest();
  var requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };
  this.errors = [];
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        methods: {
          update: [['setHeadline', 'id', 'headline'], ['setText', 'id', 'text']],
        }
    });
  var modelInstance = new Model({id: 1, headline: 'an headline', text: 'a text'});
  var successCb = function (model, result) {
    if (result.req === 'no 1') {
      equal(result.req, 'no 1', 'Server responded with the correct value (call successfully executed)');
    }

    if (result.req === 'no 2') {
      equal(result.req, 'no 2', 'Server responded with the correct value (call successfully executed)');
    }
  };

  // fetch the mocked data
  modelInstance.save({headline: 'a new headline', text: 'a new text'}, {success: successCb});

  // fire response
  requests[0].respond(200, this.contentType, '{ "id": ' + JSON.parse(requests[0].requestBody).id + ', "jsonrpc": "2.0", "result": {"req": "no 1"} }');
  requests[1].respond(200, this.contentType, '{ "id": ' + JSON.parse(requests[1].requestBody).id + ', "jsonrpc": "2.0", "result": {"req": "no 2"} }');
  xhr.restore();
});

test("can operate multiple methods (namespaced)", function () {
  expect(6);
  var xhr = sinon.useFakeXMLHttpRequest();
  var requests = [];
  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };
  this.errors = [];
  var Model = Backbone.Model.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        namespace: 'abcde',
        methods: {
          update: [['setHeadline', 'id', 'headline'], ['setText', 'id', 'text']]
        }
    });
  var modelInstance = new Model({id: 1, headline: 'an headline', text: 'a text'});
  var successCb = function (model, result) {
    if (result.req === 'no 1') {
      equal(result.req, 'no 1', 'Server responded with the correct value (call successfully executed)');
    }

    if (result.req === 'no 2') {
      equal(result.req, 'no 2', 'Server responded with the correct value (call successfully executed)');
    }
  };

  // fetch the mocked data
  modelInstance.save({headline: 'a new headline', text: 'a new text'}, {success: successCb});

  // check if namespace, method call and parameters are correct
  equal(JSON.parse(requests[0].requestBody).method, 'abcde/setHeadline', 'Method called in the correct namespace');
  equal(JSON.parse(requests[0].requestBody).params[0], 1, 'Parameters set correctly');

  equal(JSON.parse(requests[1].requestBody).method, 'abcde/setText', 'Method called in the correct namespace');
  equal(JSON.parse(requests[1].requestBody).params[0], 1, 'Parameters set correctly');

  // fire response
  requests[0].respond(200, this.contentType, '{ "id": ' + JSON.parse(requests[0].requestBody).id + ', "jsonrpc": "2.0", "result": {"req": "no 1"} }');
  requests[1].respond(200, this.contentType, '{ "id": ' + JSON.parse(requests[1].requestBody).id + ', "jsonrpc": "2.0", "result": {"req": "no 2"} }');
  xhr.restore();
});

test("collection can fetch data with a simple argument", function () {
  expect(4);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Collection = Backbone.Collection.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        model: Backbone.Model,
        namespace: 'STFU',
        beginningWith: 3,
        methods: {
          read: ['getAllNumbers', 'beginningWith']
        }
    });
  var collectionInstance = new Collection();
  var successCb = function (model) {
    // assert list of numbers
    var data = collectionInstance.toJSON();
    equal(data[0].n, 3);
    equal(data[1].n, 4);
    equal(data[2].n, 5);
  };

  // fetch the mocked data
  collectionInstance.fetch({success: successCb});

  // check arguments
  equal(JSON.parse(server.requests[0].requestBody).params[0], 3, 'Parameters set correctly');

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + collectionInstance.rpc.responseID + ', "jsonrpc": "2.0",  "result": [{"n": 3}, {"n": 4}, {"n": 5}] }']);

  //fire response
  server.respond();
  server.restore();
});


test("collection can fetch data with simple arguments", function () {
  expect(5);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Collection = Backbone.Collection.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        model: Backbone.Model,
        beginningWith: 3,
        endsWith: 5,
        methods: {
          read: ['getAllNumbers', 'beginningWith', 'endsWith']
        }
    });
  var collectionInstance = new Collection();
  var successCb = function (model) {
    // assert list of numbers
    var data = collectionInstance.toJSON();
    equal(data[0].n, 3);
    equal(data[1].n, 4);
    equal(data[2].n, 5);
  };

  // fetch the mocked data
  collectionInstance.fetch({success: successCb});

  // check arguments
  equal(JSON.parse(server.requests[0].requestBody).params[0], 3, 'Parameters set correctly');
  equal(JSON.parse(server.requests[0].requestBody).params[1], 5, 'Parameter 2 set correctly');

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + collectionInstance.rpc.responseID + ', "jsonrpc": "2.0",  "result": [{"n": 3}, {"n": 4}, {"n": 5}] }']);

  //fire response
  server.respond();
  server.restore();
});

test("collection can fetch simple data with a functional argument", function () {
  expect(4);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Collection = Backbone.Collection.extend({
        url: this.url,
        rpc: new Backbone.Rpc(),
        model: Backbone.Model,
        beginningWith: function () {
          return 3;
        },
        methods: {
          read: ['getAllNumbers', 'beginningWith']
        }
    });
  var collectionInstance = new Collection();
  var successCb = function (model) {
    // assert list of numbers
    var data = collectionInstance.toJSON();
    equal(data[0].n, 3);
    equal(data[1].n, 4);
    equal(data[2].n, 5);
  };

  // fetch the mocked data
  collectionInstance.fetch({success: successCb});

  // check arguments
  equal(JSON.parse(server.requests[0].requestBody).params[0], 3, 'Parameters set correctly');

  // set response
  server.respondWith(this.method, this.url, [200, this.contentType,'{ "id": ' + collectionInstance.rpc.responseID + ', "jsonrpc": "2.0",  "result": [{"n": 3}, {"n": 4}, {"n": 5}] }']);

  //fire response
  server.respond();
  server.restore();
});


test("Can use REST and RPC in conjunction", function () {
  expect(1);
  this.errors = [];
  server = sinon.fakeServer.create();
  var Model = Backbone.Model.extend({
        url: "/test/xyz"
    });
  var modelInstance = new Model();
  var successCb = function (model) {
    // assert list of numbers
    var data = modelInstance.toJSON();
    equal(data.title, 'Hollywood - Part 2');
  };

  // fetch the mocked data
  modelInstance.fetch({success: successCb});

  // set response
  server.respondWith("GET", "/test/xyz", [200, {"Content-Type": "application/json"}, '{"id":123,"title":"Hollywood - Part 2"}']);

  //fire response
  server.respond();
  server.restore();
});