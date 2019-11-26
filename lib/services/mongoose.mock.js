var mongoose = require('mongoose')

// this method is propagated from node-mongodb-native
mongoose.Collection.prototype.insert = function (docs, options, callback) {
    // this is what the API would do if the save succeeds!
  callback(null, docs)
}

module.exports = mongoose
