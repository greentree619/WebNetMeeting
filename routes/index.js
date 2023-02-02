
var fs  = require('fs');
var exec = require('child_process').exec;

//@ Module dependencies
var async = require('async');
var moment = require('moment');
require('../libs/Math.uuid');

// load up the user model
var User = require('../models/user');
var Room = require('../models/room');

exports.index = function(req, res) {
	res.render('index', {message: req.flash('loginMessage')});
};

exports.signup = function(req, res) {
    res.render('signup', {message: req.flash('signupMessage')});
};

exports.rooms = function(req, res, ctx) {
    ctx['avatar'] = req.user.avatar;
    res.render('rooms/list', ctx);
};

exports.roomlist = function(req, res, ctx) {
    async.waterfall([
        function(done) {
            var room_que = Room.find({}).sort({create_date : -1});
            room_que.exec(function(err, rooms) {
                done(err, rooms);
            });
        },
        function(rooms, done) {
            User.find({}, function(err, users) {
                done(err, rooms, users);
            });
        }],
        function(err, rooms, users) {
            if (err)
                throw err;

            var rooms_date = [];
            for (var i=0; i<rooms.length; i++) {
                var room_date = {};
                room_date.roomid = rooms[i]._id;
                room_date.name = rooms[i].name;
                room_date.sessid = rooms[i].sessid;
                var roomcode = rooms[i].code ? rooms[i].code : '';
                if (roomcode != '') {
                    roomcode = roomcode.substr(0, 4) + ' ' + roomcode.substr(4, 4);
                }
                room_date.roomcode = roomcode;
                room_date.create_date = moment(rooms[i].create_date).format("ddd, MMM D YYYY, H:mm:ss");

                for (var j=0; j<users.length; j++) {
                    if (rooms[i].creator == users[j]._id) {
                        room_date.creator = users[j].username;
                        if (users[j].avatar) {
                            room_date.avatar = users[j].avatar;
                        } else {
                            room_date.avatar = 'no-avatar.jpg';
                        }

                        continue;
                    }
                }
                rooms_date.push(room_date);
            }

            var ret = {};
            ret['Data'] = rooms_date;
            res.send(JSON.stringify(ret));
        }
    );
};

exports.createroom = function(req, res, ctx) {
    var ret = {};
    Room.findOne({ 'name' : req.body.meetingname }, function(err, room) {
        if (room) {
            ret['Data'] = {res: 'exist'};
            res.send(JSON.stringify(ret));
        } else {
            User.findOne({ 'email' : req.session.email }, function(err, user) {
                if (err)
                    throw err;

                var newRoom = new Room();
                newRoom.name = req.body.meetingname;
                newRoom.sessid = Math.uuid(15);
                newRoom.code = Math.uuid(8, 10);
                newRoom.creator = user._id;
                newRoom.create_date = new Date();
                newRoom.save(function(err) {
                    if (err)
                        throw err;

                    ret['Data'] = {res: 'ok'};
                    res.send(JSON.stringify(ret));
                });

            });
        }
    });
};

exports.joinbyid = function(req, res) {
    var roomcode = req.query.meetingid;
    console.log('roomcode', roomcode);
    roomcode = roomcode.replace(/ /g, '');
    console.log('roomcode', roomcode);
    Room.findOne({ 'code' : roomcode }, function(err, room) {
        if (room) {
            res.redirect('/meeting/' + room.sessid);
        } else {
            res.render('index', {message: 'Invalid Meeting ID.'});
        }
    });
};

exports.uploadrecoded = function(req, res) {
    var postData = '';
    req.addListener('data', function(postDataChunk) {
        postData += postDataChunk.toString();
    });

    req.addListener('end', function() {
        upload(postData);
    });

    res.send('ok');
};

// functions
function upload(postData) {
    var files = JSON.parse(postData);

    // writing audio file to disk
    _upload(files.audio);

    if (!files.uploadOnlyAudio) {
        // writing video file to disk
        _upload(files.video);

        //Omitted merge(files);
    }
}

function _upload(file) {
    var fileRootName = file.name.split('.').shift(),
        fileExtension = file.name.split('.').pop(),
        filePathBase = 'recorded/',
        fileRootNameWithBase = filePathBase + fileRootName,
        filePath = fileRootNameWithBase + '.' + fileExtension,
        fileID = 2,
        fileBuffer;

    while (fs.existsSync(filePath)) {
        filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
        fileID += 1;
    }

    file.contents = file.contents.split(',').pop();

    fileBuffer = new Buffer(file.contents, "base64");
    fs.writeFileSync(filePath, fileBuffer);
}

function merge(files) {
    // detect the current operating system
    var isWin = !!process.platform.match( /^win/ );

    if (isWin) {
        ifWin(files);
    } else {
        ifMac(files);
    }
}

function ifWin(files) {
    // following command tries to merge wav/webm files using ffmpeg
    var merger = __dirname + '\\..\\merger.bat';
    var audioFile = __dirname + '\\..\\recorded\\' + files.audio.name;
    var videoFile = __dirname + '\\..\\recorded\\' + files.video.name;
    var mergedFile = __dirname + '\\..\\recorded\\' + files.audio.name.split('.')[0] + '_.webm';

    // if a "directory" has space in its name; below command will fail
    // e.g. "c:\\dir name\\uploads" will fail.
    // it must be like this: "c:\\dir-name\\uploads"
    var command = merger + ', ' + audioFile + " " + videoFile + " " + mergedFile + '';
    exec(command, function (error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
        } else {
            fs.unlink(audioFile);
            fs.unlink(videoFile);
        }
    });
}

function ifMac(files) {
    // its probably *nix, assume ffmpeg is available
    var audioFile = __dirname + '/../recorded/' + files.audio.name;
    var videoFile = __dirname + '/../recorded/' + files.video.name;
    var mergedFile = __dirname + '/../recorded/' + files.audio.name.split('.')[0] + '_.webm';

    var util = require('util'),
        exec = require('child_process').exec;

    var command = "ffmpeg -i " + audioFile + " -i " + videoFile + " -map 0:0 -map 1:0 " + mergedFile;

    exec(command, function (error, stdout, stderr) {
        // if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);

        if (error) {
            console.log('exec error: ' + error);

        } else {
            // removing audio/video files
            fs.unlink(audioFile);
            fs.unlink(videoFile);
        }

    });
}
