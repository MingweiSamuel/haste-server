var path = require('path');
var fs = require('fs');

var winston = require('winston');

// For serving static assets

var StaticHandler = function(path) {
  this.basePath = path;
  this.defaultPath = '/index.html';
  // Grab the list of available files - and move into hash for quick lookup
  var available = fs.readdirSync(this.basePath);
  this.availablePaths = {};
  for (var i = 0; i < available.length; i++) {
    this.availablePaths['/' + available[i]] = true;
  }
};

// Determine the content type for a given extension
StaticHandler.contentTypeFor = function(ext) {
  if (ext == '.js') return 'text/javascript';
  else if (ext == '.css') return 'text/css';
  else if (ext == '.html') return 'text/html';
  else if (ext == '.ico') return 'image/ico';
  else {
    winston.error('unable to determine content type for static asset with extension: ' + ext);
    return 'text/plain';
  }
};

// Handle a request, and serve back the asset if it exists
StaticHandler.prototype.handle = function(incPath, response) {
  // Go to index if not found or /
  if (!this.availablePaths[incPath]) incPath = this.defaultPath;
  var filePath = this.basePath + (incPath == '/' ? this.defaultPath : incPath);
  // And then stream the file back
  var _this = this;
  fs.readFile(filePath, function(error, content) {
    if (error) {
      winston.error('unable to read file', { path: filePath, error: error.message });
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'IO: Unable to read file' }));
    }
    else {
      var contentType = StaticHandler.contentTypeFor(path.extname(filePath));
      response.writeHead(200, { 'content-type': contentType });
      response.end(content, 'utf-8');
    }
  });    
};

module.exports = StaticHandler;