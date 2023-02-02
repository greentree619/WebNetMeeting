
var fs  = require('fs');

// load up the user model
var User = require('../models/user');

exports.takeavatar = function(req, res, ctx) {
    ctx['avatar'] = req.user.avatar;
    res.render('setting/takeavatar', ctx);
};

exports.postavatar = function(req, res, ctx) {
    var file_name = (new Date().getTime()) + '_' + req.headers['x-orig-file-name'];
    var file_path = __dirname + "/../public/avatars/" + file_name;

    // upload file
    var file = fs.createWriteStream(file_path);
    req.pipe(file);

    req.on('end', function() {
        var user = req.user;
        user.avatar = file_name;
        user.save(function(err) {
            res.send(file_name);
        });
    });
};

exports.postphoto = function(req, res, ctx) {
    var postData = '';
    req.addListener('data', function(postDataChunk) {
        postData += postDataChunk.toString();
    });

    req.addListener('end', function() {
        var file_name = (new Date().getTime()) + '_' + 'photo.jpg';
        var file_path = __dirname + "/../public/avatars/" + file_name;

        var base64Data = postData.replace(/^data:image\/jpeg;base64,/, "");
        var fileBuffer = new Buffer(base64Data, "base64");
        fs.writeFileSync(file_path, fileBuffer);

        var user = req.user;
        user.avatar = file_name;
        user.save(function(err) {
            res.send(file_name);
        });
    });
};
