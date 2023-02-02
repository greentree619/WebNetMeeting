
// http requests
var home    = require('./routes/index');
var setting = require('./routes/setting');
var chat    = require('./routes/chat');

module.exports = function(app) {

    var ctx = {
        env: app.get('env')
    };

    var App={
        html:{
            pub:[
                ['/', home.index],
                ['/signup', home.signup],
                ['/joinbyid', home.joinbyid],
                ['/meeting/:sessid', chat.index]
            ]
            ,prv:[
                ['/rooms', home.rooms],
                ['/takeavatar', setting.takeavatar]
            ]
        }
        ,ajax:{
            pub:[]
            ,prv:[
                ['/postavatar',setting.postavatar],
                ['/postphoto', setting.postphoto],
                ['/post-wb-image', chat.postimage],
                ['/post-wb-camera', chat.postcamera],
                ['/roomlist', home.roomlist],
                ['/createroom', home.createroom],
                ['/upload-recorded', home.uploadrecoded]
            ]
        }

        ,init_html_handlers:function() {
            function public_handler(handler) {
                return function(req, res) {
                    try {
                        handler(req, res, ctx);
                    }
                    catch(e){
                        throw e;
                    }
                }
            }

            function private_handler(handler) {
                return function(req, res) {
                    if (req.isAuthenticated()) {
                        try {
                            ctx['username'] = req.session.username ? req.session.username : '';
                            ctx['email'] = req.session.email ? req.session.email : '';
                            handler(req, res, ctx);
                        }
                        catch(e){
                            throw e;
                        }
                    } else {
                        res.redirect('/');
                    }
                }
            }

            var list = this.html.pub;

            for (var i = 0 ; i<list.length; i++) {
                var ep = list[i]; //endpoints
                app.get(ep[0], public_handler(ep[1]));
            }

            list = this.html.prv;

            for (var i = 0 ; i<list.length; i++) {
                var ep = list[i]; //endpoints
                app.get(ep[0], private_handler(ep[1]));
            }
        }

        ,init_ajax_handlers:function() {

            function public_handler(handler) {
                return function(req, res) {
                    try {
                        handler(req, res);
                    }
                    catch(e) {
                        // log error.
                        // res.status(500) // set http status code = 500
                        //
                        var data = {
                            Data : {
                                Msg : e
                                ,Code : 401
                            }};
                        res.send(JSON.stringify(data));
                    }
                }
            }

            function private_handler(handler) {
                return function(req, res) {
                    if (req.isAuthenticated()) {
                        try {
                            handler(req, res);
                        }
                        catch(e) {
                            var data = {
                                Data : {
                                    Msg : e
                                    ,Code : 401
                                }};
                            res.send(JSON.stringify(data));
                        }
                    } else {
                        var data = {
                            Data : {
                                Msg : 'Authentication required.'
                                ,Code : 401
                            }};
                        res.send(JSON.stringify(data));
                    }
                }
            }

            var ep, list = this.ajax.pub;

            for (var i = 0 ; i<list.length; i++) {
                ep = list[i] ;//endpoints
                app.all(ep[0], public_handler(ep[1]));
            }

            list = this.ajax.prv;

            for (var i = 0 ; i<list.length; i++) {
                ep = list[i] ;//endpoints
                app.all(ep[0], private_handler(ep[1]));
            }

        }

        ,init:function(){
            this.init_html_handlers();
            this.init_ajax_handlers();
        }
    };
    App.init();
};
