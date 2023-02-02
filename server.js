
/*
 * Load required modules
 */
//var http   		    = require("http");
var http			= require('https');
var express		    = require("express");
var bodyParser	    = require('body-parser');
var cookieParser    = require('cookie-parser');
var session         = require('express-session');
var io     		    = require("socket.io");
var easyrtc 	    = require("easyrtc");
var path 		    = require('path');
var morgan          = require('morgan');
var flash           = require('connect-flash');
var passport        = require('passport');
var sharejs			= require('share').server;
var config 		    = require('./config/config');


/*
 * Setup and configure Express http server.
 */
//set up our express application
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');  // set up ejs for templating
app.set('port', config.APP_PORT);

app.use(cookieParser());    // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));   // log every request to the console
app.use(express.static(path.join(__dirname, 'public')));

require('./libs/passport')(passport); // pass passport for configuration

// required for passport

app.use(session({ secret: 'netmeetingsessionsecret', resave: true, saveUninitialized: true })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


/*
 * Route
 */
// load our routes and pass in our app and fully configured passport
require('./routes/auth.js')(app, passport);

// definition of app logic
require('./app')(app);


/**
 * @desc enable sharejs
 */
sharejs.attach(app, {db: {type: 'none'}});

/*
 * Start Express http server on port APP_PORT
 */
 var fs = require('fs');
var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

/*
var httpServer = http.createServer(app).listen(config.APP_PORT, function() {
	console.log('Express server listening on port ' + app.get('port'));
});
*/
var httpServer = http.createServer(options, app).listen(config.APP_PORT, function() {
	console.log('Express server listening on port ' + app.get('port'));
});

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(httpServer, {"log level":1});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer);

