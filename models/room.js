
var mongoose = require('mongoose');

// define the schema for our rooms model
var roomSchema = mongoose.Schema({
    name        : String,
    sessid      : String,
    code        : String,
    creator     : String,
    create_date : Date
});

// methods ======================

// create the model for rooms and expose it to our app
module.exports = mongoose.model('Room', roomSchema);
