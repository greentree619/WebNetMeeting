
$(document).ready(function() {
    set_layout();

    reassign_ui();

    top_controls();

    set_video_avatar('mine');
});

window.onresize = function() {
    set_main_height();

    reassign_ui();
};

function onResizeLayout() {
    reassign_ui();
}

function top_controls() {
    $('#audio-switch').kendoButton({
        spriteCssClass: 'k-icon audio-on',
        click: function(e) {
            var enable = null;
            var btn = $('#audio-switch');

            if (btn.data('flag') != 'on') {
                // ui
                btn.addClass('k-primary');
                btn.children('.k-icon').removeClass('audio-on').addClass('audio-off');
                btn.data('flag', 'on');

                enable = false;
            } else {
                // ui
                btn.removeClass('k-primary');
                btn.children('.k-icon').removeClass('audio-off').addClass('audio-on');
                btn.data('flag', 'off');

                enable = true;
            }

            show_mic_status('mine', enable);

            if (enableMicrophone) {
                enableMicrophone(enable);
            }
        }
    });

    $('#camera-switch').kendoButton({
        spriteCssClass: 'k-icon camera-on',
        click: function(e) {
            var enable = null;
            var btn = $('#camera-switch');

            if (btn.data('flag') != 'on') {
                // ui
                btn.addClass('k-primary');
                btn.children('.k-icon').removeClass('camera-on').addClass('camera-off');
                btn.data('flag', 'on');

                enable = false;
            } else {
                // ui
                btn.removeClass('k-primary');
                btn.children('.k-icon').removeClass('camera-off').addClass('camera-on');
                btn.data('flag', 'off');

                enable = true;
            }

            show_video_avatar('mine', enable);

            if (enableCamera) {
                enableCamera(enable);
            }
        }
    });

    $('#meetingid').focus(function() {
        console.log('mmmmmm');
        $(this).select();
    });
}

function set_layout() {
    set_main_height();

    $("#tabstrip").kendoTabStrip({
        animation:  {
            open: {
                effects: "fadeIn"
            }
        },
        select: function() {
            reassign_ui();
        }
    });

    $('#vertical').kendoSplitter({
        orientation: 'vertical',
        panes: [
            { collapsible: false, scrollable: false, size: '100%' }
        ]
    });

    $('#horizontal').kendoSplitter({
        panes: [
            { collapsible: true, size: '25%', scrollable: false },
            { collapsible: false, scrollable: true }
        ],
        resize: onResizeLayout
    });
}

function set_main_height() {
    var main_height = window.innerHeight - $('#header').height() - 7;
    $('#vertical').height(main_height);
}

function reassign_ui() {
    // tab content
    $('.tab-content').height($('#horizontal').height() - 50);

    // owner video
    //var h = $('#vd-mine').width() * 0.75;
    var h = $('.tab-content').width() * 0.75;
    $('#vd-mine').height(h);

    // chat view
    //var cv_height = $('.tab-content').height() - $('#vd-mine').height() - 40;
    //$('.chat-view-container').height(cv_height);
}

function set_video_avatar(who) {
    if (who == 'mine') {
        $('.owner-container .video-avatar').css('background-image', 'url("/avatars/' + myinfor.avatar + '")');
    }
}

/* For Mute mic, Disable camera */
function show_mic_status(who, enable) {
    var icon_obj = null;
    if (who == 'mine') {
        icon_obj = $('.mute-my-icon');
    } else {
        icon_obj = $('video[data-eid=' + who + ']').parent().children('div.mute-other-icon');
    }

    if (enable) {
        icon_obj.addClass('hidden');
    } else {
        icon_obj.removeClass('hidden');
    }
}

function show_video_avatar(who, enable) {
    var avatar_obj = null;
    if (who == 'mine') {
        avatar_obj = $('.owner-container .video-avatar');
    } else {
        avatar_obj = $('video[data-eid=' + who + ']').parent().children('div.video-avatar');
        avatar_obj.css('background-image', 'url("/avatars/' + participants[who].avatar + '")');
    }

    if (enable) {
        avatar_obj.css('opacity', 0);
    } else {
        avatar_obj.css('opacity', 1);
    }
}

function show_other_status(who, infor) {
    show_mic_status(who, infor.enable_audio);

    show_video_avatar(who, infor.enable_camera);
}
