var crypto = require('crypto')

exports.hashPW = function(pwd){
	return crypto.createHash('sha256').update(pwd).digest('base64').toString();
}

var records = [
    { id: 1, name: 'tomtom', password: exports.hashPW('gadula123'), displayName: 'TomTom', emails: [ { value: 'tomtom@example.com' } ] }
  , { id: 2, name: 'test', password: exports.hashPW('test'), displayName: 'test', emails: [ { value: 'majtek@example.com' } ] }
];

exports.findById = function(id, cb) {
  process.nextTick(function() {
    var idx = id - 1;
    if (records[idx]) {
      cb(null, records[idx]);
    } else {
      cb(new Error('User ' + id + ' does not exist'));
    }
  });
}

exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      if (record.name === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
}
