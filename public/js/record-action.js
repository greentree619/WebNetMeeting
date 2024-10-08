var isRecordOnlyAudio = !!navigator.mozGetUserMedia;
var localStream = null;
var audioRecorder;
var videoRecorder;
var recFileName;
var startedRecord = false;

$(function() {
    var startRecordingCallback = function(){
        startRecording();

        btnStartRecording.enable(false);
        btnStopRecording.enable(true);
    };

    var stopRecordingCallback = function(){
        stopRecording();

        btnStartRecording.enable(true);
        btnStopRecording.enable(false);
    };
    easyrtc.callbackStartRecord = startRecordingCallback;
    easyrtc.callbackStopRecord = stopRecordingCallback;

    var btnStartRecording = $('#start-recording').kendoButton({
        click: function(e) {
			easyrtc.startRecord(startRecordingCallback);
            
        }
    }).data("kendoButton");

    var btnStopRecording = $('#stop-recording').kendoButton({
        click: function(e) {
			easyrtc.stopRecord(stopRecordingCallback);            
        }
    }).data("kendoButton");
});

function startRecording() {
    recFileName = myinfor.my_name + '_' + getNow();
    startedRecord = true;
    localStream = easyrtc.getLocalStream();

	var audioConfig = {};
    if(!isRecordOnlyAudio) {
        audioConfig.onAudioProcessStarted = function() {
            videoRecorder.startRecording();
        };
    }

    audioRecorder = RecordRTC(localStream, audioConfig);

    if(!isRecordOnlyAudio) {
        var videoConfig = { type: 'video' };
        videoRecorder = RecordRTC(localStream, videoConfig);
    }

    audioRecorder.startRecording();
}

function stopRecording() {
    if (!startedRecord) {
        return;
    }
	if(isRecordOnlyAudio) {
        audioRecorder.stopRecording(onStopRecording);
    }

    if(!isRecordOnlyAudio) {
        audioRecorder.stopRecording(function() {
            videoRecorder.stopRecording(function() {
                onStopRecording();
            });
        });
    }

    startedRecord = false;
}

function onStopRecording() {
    audioRecorder.getDataURL(function(audioDataURL) {
        var audio = {
            blob: audioRecorder.getBlob(),
            dataURL: audioDataURL
        };

        // if record both wav and webm
        if(!isRecordOnlyAudio) {
            videoRecorder.getDataURL(function(videoDataURL) {
                var video = {
                    blob: videoRecorder.getBlob(),
                    dataURL: videoDataURL
                };

                postFiles(audio, video);
            });
        }

        // if record only audio (either wav or ogg)
        if (isRecordOnlyAudio) postFiles(audio);
    });
}

function postFiles(audio, video) {
    // getting unique identifier for the file name
    recFileName += '~' + getNow();
    
    // this object is used to allow submitting multiple recorded blobs
    var files = { };

    // recorded audio blob
    //{{Omitted
    // files.audio = {
    //     name: recFileName + '.' + audio.blob.type.split('/')[1],
    //     type: audio.blob.type,
    //     contents: audio.dataURL
    // };

    // if(video) {
    //     files.video = {
    //         name: recFileName + '.' + video.blob.type.split('/')[1],
    //         type: video.blob.type,
    //         contents: video.dataURL
    //     };
    // }
    //}}Omitted
    var audioFile = new File([audio.blob], recFileName + '.' + audio.blob.type.split('/')[1]);
    var videoFile = new File([video.blob], recFileName + '.' + video.blob.type.split('/')[1]);

    files.uploadOnlyAudio = !video;

    uploadToS3( 'https://epc1mr6fd6.execute-api.us-east-2.amazonaws.com/prod/', audioFile, '123456789', 'progress-bar-audio');
    uploadToS3( 'https://epc1mr6fd6.execute-api.us-east-2.amazonaws.com/prod/', videoFile, '123456789', 'progress-bar-video');

    //{{Omitted
    // xhr('/upload-recorded', JSON.stringify(files), function(_fileName) {
    // 	console.log(_fileName);
    // });
    //}}
}

function uploadToS3( baseUrl, file, meetingId, progressBar ) {
    const uploaderOptions = {
        file: file,
        baseURL: baseUrl,
        meetingId: meetingId
    }

    let percentage = undefined
    const uploader = new Uploader(uploaderOptions)
    const tBegin = performance.now()
    uploader.onProgress(({ percentage: newPercentage }) => {
            // to avoid the same percentage to be logged twice
            if (percentage === 100) {
                $(`#${progressBar}`).width(100 + '%');
            }
            if (newPercentage !== percentage) {
                percentage = newPercentage
                $(`#${progressBar}`).width(percentage + '%');
            }
        })
        .onError((error) => {
            console.error(error)
        })

    uploader.start()
}

// XHR2/FormData
function xhr(url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback(request.responseText);
        }
    };
    request.upload.onprogress = function(e) {
        if (e.loaded <= e.total) {
            var percent = Math.round(e.loaded / e.total * 100);
            $('#progress-bar-audio').width(percent + '%');
        } 

        if(e.loaded == e.total){
            $('#progress-bar-audio').width(100 + '%');
        }
    };
    request.upload.onload = function() {
    };

    request.open('POST', url);
    request.send(data);
}

// generating random string
function generateRandomString() {
    if (window.crypto) {
        var a = window.crypto.getRandomValues(new Uint32Array(3)),
            token = '';
        for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
        return token;
    } else {
        return (Math.random() * new Date().getTime()).toString(36).replace( /\./g , '');
    }
}

function getNow() {
	var nowDate = new Date();
	return nowDate.getFullYear() + '-' + (nowDate.getMonth() + 1) + '-' + nowDate.getDate() + '_' + nowDate.getHours() + 'h' + nowDate.getMinutes() + 'm' + nowDate.getSeconds() + 's';
}
