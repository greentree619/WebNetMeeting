
"use strict";

var ajax = (function(){

    /*
     server response format:

     if successful:
     {
     Data : ...
     }

     if failure:
     http status code is either
     401 : login required or for session expired
     500 : for all other server side error
     error response format is
     {
     Data : {
     Msg : 'string containing'
     Code : int. optional. we create a code for the error if we need client side processing
     }
     }

     */

    function cb_success(me,opts){
        return function(data, textStatus, jqXHR){
            //console.log(me,opts,arguments)
            var json = JSON.parse(data);
            if(opts.success){
                if(opts.scope){
                    opts.success.call(opts.scope,json.Data,opts);
                }
                else{
                    opts.success(json.Data,opts);
                }
            }
        };
    }
    function cb_error(me,opts){
        return function(jqXHR, textStatus, errorThrown){

            var resp;

            switch(jqXHR.status){
                case 0: resp = 'Connection error.' ; break;
                case 401:
                    window.location = "/";
                    // instead of redirecting browser to index page
                    // we can also open a login dialog box
                    // eg login_dialog.show();
                    break;
                case 500:

                    resp = JSON.parse(jqXHR.responseText);
                    //console.error(resp);
                    resp = resp.Data.Msg;
                //alert("An error has occurred.");
                default:
                    console.error(arguments);
                    break
            }

            if (opts.error){
                if(opts.scope)
                    opts.error.call(opts.scope,resp);
                else
                    opts.error(resp);
            }
        };
    }

    return {
        post : function(opts){
        // opt = {url, data, scope, successCB, errorCB}
        var me = this;

        $.ajax({
            type: "POST"
            ,url: opts.url
            ,data: opts.data
            ,success: cb_success(this,opts)
            ,error: cb_error(this,opts)
            //,dataType: dataType
        });

    }
    ,upload : function(opts){
        // opt = {url, data, scope, successCB, errorCB}
        $.ajax({
            type: "POST"
            ,processData: false
            ,contentType: false
            ,cache: false
            // ==================== options
            ,url: opts.url
            ,data: opts.data
            ,success: cb_success(this,opts)
            ,error: cb_error(this,opts)
        });
    }
    ,upload_progress:function(opts){

        $.ajax({
            type: "POST"
            ,processData: false
            ,contentType: false
            ,cache: false
            , xhrc: function(){

                var xhr = new window.XMLHttpRequest();

                //Upload progress
                xhr.upload.addEventListener("progress", function(evt){
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        if(opts.upload_progress_cb){
                            if(opts.scope)
                                opts.upload_progress_cb.call(opts.scope,percentComplete);
                            else
                                opts.upload_progress_cb(percentComplete);
                        }
                    }
                }, false);

                //Download progress
                xhr.addEventListener("progress", function(evt){
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        if(opts.dnload_progress_cb){
                            if(opts.scope)
                                opts.dnload_progress_cb.call(opts.scope,percentComplete);
                            else
                                opts.dnload_progress_cb(percentComplete);
                        }
                    }
                }, false);

                return xhr;
            }
            ,url: opts.url
            ,data: opts.data
            ,success: cb_success(this,opts)
            ,error: cb_error(this,opts)
        })
    }
};
})();
