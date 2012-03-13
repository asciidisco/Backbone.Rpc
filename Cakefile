fs = require 'fs'
exec = require('child_process').exec

task 'build', 'batch execute everything', () ->
  	invoke 'clean'
  	invoke 'build:document'
  	invoke 'build:concat'
  	#invoke 'test'  	

task 'clean', 'cleaning up dist and docs folder', () ->
  	console.log 'Cleaning up dist and docs folder'
  	fs.unlink 'docs'
  	fs.unlink 'dist'
  	fs.mkdir 'dist'

task 'test', 'running tests with phantom', () ->
  	console.log 'Running tests'
  	exec 'phantomjs bin/phantomjs.js', (error, stdout, stderr) -> 
    console.log stdout
    console.log stderr
    if error != null
      console.log  error

task 'build:document', 'generates docs with docco', () ->
	console.log 'Creating documentation'
	exec 'docco src/backbone.rpc.js'

task 'build:concat', 'adds the license tag to the output file', () ->
  	console.log 'Adding license tag to the output file'
  	rpc = fs.readFileSync 'src/backbone.rpc.js', 'utf-8'
  	license = fs.readFileSync 'license.txt', 'utf-8'
  	fs.writeFileSync 'dist/backbone.rpc.js', license + '\n\n' + rpc, 'utf-8'