module.exports = function(app, passport) {

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();

        req.session.email = '';
        req.session.username = '';
        req.session.avatar = '';
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // process the login form
    app.post('/login', function(req, res, next) {
        passport.authenticate('local-login', {
            failureRedirect: '/',    // redirect back to the signup page if there is an error
            failureFlash : true     // allow flash messages
        }, function(err, user) {
            if (err) { return next(err); }
            if (!user)
                return res.redirect('/');

            req.login(user, function(err) {
                if (err) { return next(err); }

                req.session.email = user.email;
                req.session.username = user.username;
                req.session.avatar = user.avatar;

                return res.redirect('/rooms');
            });
        })(req, res, next);
    });

    // SIGNUP =================================
    // process the signup form
    app.post('/signup', function(req, res, next) {
        passport.authenticate('local-signup', {
            failureRedirect: '/',    // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }, function(err, user) {
            if (err) { return next(err); }
            if (!user)
                return res.redirect('/signup');

            req.login(user, function(err) {
                if (err) { return next(err); }

                req.session.email = user.email;
                req.session.username = user.username;
                req.session.avatar = user.avatar;

                return res.redirect('/rooms');
            });
        })(req, res, next);
    });

};
