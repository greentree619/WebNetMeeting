
var pb = $("#progressBar").kendoProgressBar({
    min: 0,
    max: 100,
    type: "value",
    animation: {
        duration: 400
    }
}).data("kendoProgressBar");
pb.value(false);

$('#upload-photo').click(function() {
    $('#inp-file').click();
});

$('#inp-file').bind('change', function(e) {
    var files = e.target.files;
    if (!files || files.length === 0) {
        return;
    }
    var file = files[0];

    show_panel('#progressBar');

    var reader = new FileReader();
    reader.addEventListener('loadend', function () {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/postavatar', true);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.setRequestHeader("x-orig-file-name", file.name);
        xhr.send(file);
        xhr.onreadystatechange = function() {
            if(xhr.readyState == 4 && xhr.status == 200) {
                $('#avatar').attr('src', '/avatars/' + xhr.responseText);

                hide_panel('#progressBar');
            }
        }
    }, false);
    reader.readAsBinaryString(file);
});

var localMediaStream = null;
var video = $('#photo')[0];
var canvas = $('#canv')[0];
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL;

$('#open-camera').click(function() {
    navigator.getUserMedia({ video: true }, function (stream) {
        video.src = window.URL.createObjectURL(stream);
        localMediaStream = stream;

        show_panel('#camera-panel');
    }, function (e) {
        alert('Failed to open your camera');
    });
});

$('#take-photo').click(function() {
    if (localMediaStream) {
        show_panel('#progressBar');

        var ctx = canvas.getContext('2d');
        // reverse and draw
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, -400, 300);
        ctx.restore();
        $('#img-photo').attr('src', canvas.toDataURL('image/jpeg'));

        // save to server
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                $('#avatar').attr('src', '/avatars/' + xhr.responseText);

                hide_panel('#progressBar');
            }
        };
        xhr.upload.onprogress = function(event) {
        };
        xhr.upload.onload = function() {
        };

        xhr.open('POST', '/postphoto', true);
        xhr.send(canvas.toDataURL('image/jpeg'));
    }
});
