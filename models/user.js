
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var config = require('../config/config');

mongoose.connect(config.dev.dbUrl, function(err) {
	if(err) throw err;
});

// define the schema for our user model
var userSchema = mongoose.Schema({
    email       : String,
    username    : String,
    password    : String,
    avatar      : String
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
