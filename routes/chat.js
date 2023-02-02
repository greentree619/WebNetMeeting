
var fs  = require('fs');

// load up the user model
var User = require('../models/user');
var Room = require('../models/room');

exports.index = function(req, res, ctx) {
    if (req.user && req.user.avatar) {
        ctx['avatar'] = req.user.avatar;
    } else {
        ctx['avatar'] = 'no-avatar.jpg';
    }
    if (!ctx['username']) {
        ctx['username'] = 'guest';
    }
    var sessid = req.params.sessid;
    ctx['sessid'] = sessid;

    Room.findOne({ 'sessid' : sessid }, function(err, room) {
        if (err)
            throw err;
        ctx['roomname'] = room.name;
        var roomcode = room.code ? room.code : '';
        if (roomcode != '') {
            roomcode = roomcode.substr(0, 4) + ' ' + roomcode.substr(4, 4);
        }
        ctx['roomcode'] = roomcode;

        res.render('chat/index', ctx);
    });
};

exports.postimage = function(req, res) {
    var file_name = req.headers['x-file-name'];
    var file_path = __dirname + "/../public/upload/" + file_name;

    // upload file
    var file = fs.createWriteStream(file_path);
    req.pipe(file);

    req.on('end', function() {
        res.send('file_name');
    });
};

exports.postcamera = function(req, res) {
    var postData = '';
    req.addListener('data', function(postDataChunk) {
        postData += postDataChunk.toString();
    });

    req.addListener('end', function() {
        var file_name = req.headers['x-file-name'];
        var file_path = __dirname + "/../public/upload/" + file_name;

        var base64Data = postData.replace(/^data:image\/jpeg;base64,/, "");
        var fileBuffer = new Buffer(base64Data, "base64");
        fs.writeFileSync(file_path, fileBuffer);

        res.send(file_name);
    });
};
