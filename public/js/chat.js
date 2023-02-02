
var maxCALLERS = 7;

$(document).ready(function() {
    easyrtc.dontAddCloseButtons(false);

    connect();

    $('#frm-chat').submit(function(e) {
        e.preventDefault();

        var text = $('#chat-text').val();
        text = sanitize(text);
        if (text.length === 0) {
            return false;
        }

        var dest = {};
        dest.targetRoom = myinfor.room;
        sendMessage(dest, 'CHAT-TEXT', text);

        addToConversation('ME', 'CHAT-TEXT', text);
        $('#chat-text').val('');
    });
});

function sendMessage(dest, msgType, msgData) {
    easyrtc.sendDataWS(dest, msgType, msgData, function(reply) {
        if (reply.msgType === "error") {
            easyrtc.showError(reply.msgData.errorCode, reply.msgData.errorText);
        }
    });
}

function connect() {
    easyrtc.setUsername(myinfor.my_name);

    easyrtc.setPeerListener(addToConversation);
    easyrtc.setRoomOccupantListener(callEverybody);

    easyrtc.easyApp("NetMeeting", "vd-mine", ["user1", "user2", "user3", "user4", "user5", "user6", "user7"], loginSuccess);

    easyrtc.setDisconnectListener(function() {
        console.log('setDisconnectListener');
        easyrtc.showError("LOST-CONNECTION", "Lost connection to signaling server");
    });
    easyrtc.setOnCall( function(easyrtcid, slot) {
        console.log('setOnCall');
        var boxid = getIdOfBox(slot+1);
        $('#' + boxid).css('display', 'block');
        $('#' + boxid).attr('data-eid', easyrtcid);

        var dest = {};
        dest.targetEasyrtcid = easyrtcid;
        sendMessage(dest, 'REQ-STATUS', '');

        // add to participants
        participants[easyrtcid] = {};
        console.log(participants);
    });

    easyrtc.setOnHangup(function(easyrtcid, slot) {
        console.log('setOnHangup');
        setTimeout(function() {
            var boxid = getIdOfBox(slot+1);
            $('#' + boxid).css('display', 'none');
        }, 20);

        // remove in participants
        delete participants[easyrtcid];
        console.log(participants);
    });
}

function getIdOfBox(boxNum) {
    return "user" + boxNum;
}

function callEverybody (roomName, occupants) {
    //console.log(roomName);
    if (roomName == 'global' || roomName == 'default')
        return;

    easyrtc.setRoomOccupantListener(null); // so we're only called once.

    var list = [];
    var connectCount = 0;

    for (var easyrtcid in occupants ) {
        list.push(easyrtcid);
    }
    //
    // Connect in reverse order. Latter arriving people are more likely to have
    // empty slots.
    //
    function establishConnection(position) {
        console.log('establishConnection');
        function callSuccess() {
            console.log('callSuccess');
            connectCount++;
            if ( connectCount < maxCALLERS && position > 0) {
                establishConnection(position - 1);
            }
        }
        function callFailure() {
            console.log('callFailure');
            easyrtc.showError("CALL-REJECTED", "Rejected by other party");
            if ( connectCount < maxCALLERS && position > 0) {
                establishConnection(position - 1);
            }
        }
        easyrtc.call(list[position], callSuccess, callFailure);
    }
    if ( list.length > 0) {
        establishConnection(list.length-1);
    }
}

function loginSuccess() {
    joinARoom();
}

function joinARoom(global){
    var newRoom = myinfor.room;
    if (global)
        newRoom = global;

    var actualRoom = null;
    for (var i in easyrtc.getRoomsJoined()) {
        actualRoom = i;
    }

    if (newRoom === actualRoom) {
        alert("You can't join this room.");
        location.href = '/rooms';
        return;
    }

    easyrtc.leaveRoom(actualRoom, function(actualRoom) {
        //console.log("leave " + actualRoom);
    }, function(errorCode, errorText, actualRoom){
        console.log("Failure " + actualRoom);
    });

    easyrtc.joinRoom(newRoom, null, function(newRoom) {
        //console.log("Success to join " + newRoom);
    }, function(errorCode, errorText, newRoom){
        console.log("Failure to join " + newRoom);
    });
}

function addToConversation(who, msgType, content) {
    switch (msgType) {
        case 'CHAT-TEXT' :
            appendToChatView(who, content);
            break;
        case 'REQ-STATUS' :
            responseStatus(who);
            break;
        case 'RES-STATUS' :
            participants[who]['avatar'] = content.avatar;

            show_other_status(who, content);
            break;
        case 'CHANGE-MIC' :
            show_mic_status(who, content);
            break;
        case 'CHANGE-AVATAR' :
            show_video_avatar(who, content);
            break;
        default :
            break;
    }
}

function sanitize(msg) {
    msg = msg.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    msg = msg.replace(/\n/g, '<br />');

    return msg;
}

function appendToChatView(who, content) {
    content = sanitize(content);
    var msgArticle = null;
    var d = new Date();
    var nowTime = d.getHours() + ':' + d.getMinutes();
    if (who === 'ME') {
        msgArticle = $('<article/>').addClass('entry');
        var msgPane = $('<div/>').addClass('chat-message').addClass('from-self')
            .append('<p class="time">' + nowTime + '</p>')
            .append('<p class="body"><span>' + content + '</span></p>');
        msgArticle.append(msgPane);
    } else {
        msgArticle = $('<article/>').addClass('entry');
        var msgPane = $('<div/>').addClass('chat-message')
            .append('<div class="avatar" style="background-image: url(/avatars/' + participants[who].avatar + ');"></div>')
            .append('<p class="body"><span>' + content + '</span></p>')
            .append('<p class="time">' + nowTime + '</p>');
        msgArticle.append(msgPane);
    }

    var msgList = $('.chat-view-container');
    msgList.append(msgArticle);

    $('.chat-view-container').scrollTop(100000);
}

function responseStatus(who) {
    var dest = {};
    dest.targetEasyrtcid = who;
    sendMessage(dest, 'RES-STATUS', myinfor);
}

function save_to_disk(fileUrl, fileName) {
    var save = document.createElement("a");
    save.href = fileUrl;
    save.target = "_blank";
    save.download = fileName || fileUrl;

    var evt = document.createEvent('MouseEvents');
    evt.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);

    save.dispatchEvent(evt);

    window.URL.revokeObjectURL(save.href);
}

function enableMicrophone(enable) {
    // Enable Microphone
    easyrtc.enableMicrophone(enable);

    // notice to all
    var dest = {};
    dest.targetRoom = myinfor.room;
    sendMessage(dest, 'CHANGE-MIC', enable);

    myinfor.enable_audio = enable;
}

function enableCamera(enable) {
    // Enable Camera
    easyrtc.enableCamera(enable);

    // notice to all
    var dest = {};
    dest.targetRoom = myinfor.room;
    sendMessage(dest, 'CHANGE-AVATAR', enable);

    myinfor.enable_camera = enable;
}