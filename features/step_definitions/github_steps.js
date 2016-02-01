'use strict';

/* jshint -W061 */
// wtf jshint? eval can be harmful? But that is not eval, it's JSONPath#eval
var jsonPath = require('JSONPath').eval;
/* jshint +W061 */
var url = require('url')

var GithubStepsWrapper = function () {

  this.World = require('../support/world.js').World

  this.When(/^I GET the root document$/,
      function(callback) {
    this.get(this.rootPath(), callback)
  })

  this.When(/^I GET the gist (\d+)$/, function(gist, callback) {
    this.get(this.gistPath(gist), callback)
  })

  this.When(/^I GET the issue (\d+) in repository (.*) owned by (.*)$/,
      function(issue, repo, owner, callback) {
    this.get(this.issuePath(owner, repo, issue), callback)
  })

  this.When(/^I GET a non-existing resource$/, function(callback) {
    this.get('/does/not/exist', callback)
  })

  /* THEN */

  this.Then(/^the http status should be (\d+)$/, function(status, callback) {
    if (!assertResponse(this.lastResponse, callback)) { return }
    // deliberately using != here (no need to cast integer/string)
    /* jshint -W116 */
    if (this.lastResponse.statusCode != status) {
    /* jshint +W116 */
      callback &&
      callback.fail('The last http response did not have the expected ' +
        'status, expected ' + status + ' but got ' +
        this.lastResponse.statusCode)
    } else {
      callback()
    }
  })

  // Check if a certain property of the response is equal to something
  this.Then(/^(?:the )?([\w_.$\[\]]+) should equal "([^"]+)"$/,
      function(key, expectedValue, callback) {
    if (!assertPropertyIs(this.lastResponse, key, expectedValue, callback)) {
      return
    }
    if (callback) {
        callback();
    }
  })

  // Check if a substring is contained in a certain property of the response
  this.Then(/^I should see "([^"]+)" in the (\w+)$/,
      function(expectedContent, key, callback) {
    if (!assertPropertyContains(this.lastResponse, key, expectedContent,
        callback)) {
      return
    }
    callback && callback()
  })

  function assertResponse(lastResponse, callback) {
    if (!lastResponse) {
        callback &&
      callback.fail(new Error('No request has been made until now.'))
      return false
    }
    return true
  }

  function assertBody(lastResponse, callback) {
    if (!assertResponse(lastResponse, callback)) { return false }
    if (!lastResponse.body) {
        callback &&
      callback.fail(new Error('The response to the last request had no body.'))
      return null
    }
    return lastResponse.body
  }

  function assertValidJson(lastResponse, callback) {
    var body = assertBody(lastResponse, callback)
    if (!body) {
      return null
    }
    try {
      return JSON.parse(body)
    } catch (e) {
        callback &&
      callback.fail(
        new Error('The body of the last response was not valid JSON.'))
      return null
    }
  }

  function assertPropertyExists(lastResponse, key, expectedValue,
      callback) {
    var object = assertValidJson(lastResponse, callback)
    if (!object) { return null }
    var property
    if (key.indexOf('$.') !== 0 && key.indexOf('$[') !== 0){
      // normal property
      property = object[key]
    } else {
      // JSONPath expression
      var matches = jsonPath(object, key)
      if (matches.length === 0) {
        // no match
        callback &&
        callback(new Error('The last response did not have the property: ' +
          key + '\nExpected it to be\n' + expectedValue));
        return null
      } else if (matches.length > 1) {
        // ambigious match
        callback &&
        callback.fail('JSONPath expression ' + key + ' returned more than ' +
          'one match in object:\n' + JSON.stringify(object))
        return null
      } else {
        // exactly one match, good
        property = matches[0]
      }
    }
    if (property == null) {
        callback &&
      callback.fail('The last response did not have the property ' +
        key + '\nExpected it to be\n' + expectedValue)
      return null
    }
    return property
  }

  function assertPropertyIs(lastResponse, key, expectedValue, callback) {
    var value = assertPropertyExists(lastResponse, key, expectedValue, callback)
    if (!value) { return false }
    if (value !== expectedValue) {
        callback &&
      callback(new Error('The last response did not have the expected content in ' +
        'property ' + key + '. ' + 'Got:\n\n' + value + '\n\nExpected:\n\n' +
        expectedValue));
      return false
    }
    return true
  }

  function assertPropertyContains(lastResponse, key, expectedValue, callback) {
    var value = assertPropertyExists(lastResponse, key, expectedValue, callback)
    if (!value) { return false }
    if (value.indexOf(expectedValue) === -1) {
        callback &&
      callback.fail('The last response did not have the expected content in ' +
        'property ' + key + '. ' +
        'Got:\n\n' + value + '\n\nExpected it to contain:\n\n' + expectedValue)
      return false
    }
    return true
  }
}

module.exports = GithubStepsWrapper
