(function (window, $, undefined) {

    var itw = function (options) {

        this._url = options.url

        this._streamsCnt = options.streams || 4;

        this._format = options.format != 'dataURI' ? 'img' : 'dataURI';

        this._setupTransport();

        this._cachePrefix = (options.storageKeySuffix || '_itw') + this._url;
    };

    itw.prototype = {

        _seq:0,

        _readyFn:undefined,

        _streams:[],
        _streamsCnt:1,
        _aliveStreamsCnt:0,

        _cachePrefix:0,

        get:function (what, callback) {

            var i, item, inCache, blob;
            if (typeof what === 'string') {
                what = [what];
            }

            for (i in what) {

                if (blob = this._checkImgInCache(what[i])) {
                    //console.log('cache hit:'+this._cachePrefix + what[i], blob)
                    callback.call(null, i, this._createImageFromBlob(blob));
                }
                //console.log('cache loss:'+this._cachePrefix + what[i])

                var request = {
                    msg:{
                        src:what[i]
                    },
                    srcId:i,
                    fn:callback
                };

                var stream = this._chooseStream();

                request.msg.id = stream.queue.push(request) - 1;

                stream.queueSize++;

                stream.ob.send(request.msg);
            }

        },

        _checkImgInCache:function (src) {
            //@todo current cache using doesn't work
            return;
            return localStorage.getItem(this._cachePrefix + src);
        },

        _chooseStream:function () {

            var i, min = Number.MAX_VALUE, res;
            for (i in this._streams) {
                if ((!this._aliveStreamsCnt || this._streams[i].ready) && min > this._streams[i].queueSize) {
                    min = this._streams[i].queueSize;
                    res = this._streams[i];
                }
            }

            return res;
        },

        _onMsg:function (i, data) {
            var stream = this._streams[i];
            this._decodeData(stream.queue, data);
            stream.queueSize--;
        },

        _decodeData:function (queue, data) {

            var slice = data.slice || data.webkitSlice,

            // the last 4 byte in response data is msgId (as Uint32)
                msgIdInBlob = slice.call(data, -4),
                imgDataInBlob = slice.call(data, 0, -4),

                msgId, reader, cachePrefix = this._cachePrefix,

            //convert blob to Image
                img = this._createImageFromBlob(imgDataInBlob);

            // parse imgId
            reader = new FileReader();
            reader.onload = function (e) {
                msgId = new Uint32Array(e.target.result)[0];
                localStorage.setItem(cachePrefix + queue[msgId].msg.src, imgDataInBlob);

                queue[msgId].fn.call(null, queue[msgId].srcId, img);
                delete queue[msgId];
            };

            reader.readAsArrayBuffer(msgIdInBlob);
        },

        _createImageFromBlob:function (blob) {
            var URL = window.URL || window.webkitURL,
                img;

            if (this._format == 'dataURI') {
                // @FIXME Had better to use revokeObjectURL after using the returned result
                return URL.createObjectURL(blob);
            }

            img = new Image();
            img.onload = function () {
                URL.revokeObjectURL(this.src);
            };

            img.src = URL.createObjectURL(blob);
            return img;
        },

        _onConnect:function (i) {
            console.log('connected', i);
            this._aliveStreamsCnt++;
            this._streams[i].ready = true;
        },

        _onClose:function (i) {
            console.log('closed', i);
            this._aliveStreamsCnt--;
            this._streams[i].ready = false;
            //@todo add requeing to another stream
            this._streams[i].queue = [];
            this._streams[i].queueSize = 0;
        },

        _setupTransport:function () {

            var options, i;

            for (i = 0; i < this._streamsCnt; i++) {

                options = {
                    onResponse:$.proxy(this._onMsg, this, i),
                    onConnect:$.proxy(this._onConnect, this, i),
                    onClose:$.proxy(this._onClose, this, i),
                    url:this._url
                };

                this._streams[i] = {
                    ob:new transport(options),
                    queueSize:0,
                    ready:false,
                    queue:[],
                    i:i
                };
            }

        }

    };


    var transport = function (options) {

        this._url = options.url || 'ws://' + window.location.host;
        console.log('url', options.url)
        if (!options.onResponse) {
            throw Error("How can I notify you about request without 'onResponse' callback?");
        }
        this._fnMsg = options.onResponse;

        this._fnConnect = options.onConnect;
        this._fnClose = options.onClose;

        this._connect();
    };

    transport.prototype = {
        _ws:undefined,

        _url:'',
        _connected:false,
        _connectAttempts:0,

        _connect:function () {
            this._connectAttempts++;
            this._defer = new $.Deferred();

            if (this._fnConnect) {
                this._defer.done(this._fnConnect)
            }

            (function (_this) {
                setTimeout(function () {
                    _this._ws = new WebSocket(_this._url);

                    _this._ws.onopen = $.proxy(_this._handleOpen, _this);
                    _this._ws.onclose = $.proxy(_this._handleClose, _this);
                    _this._ws.onmessage = $.proxy(_this._handleMessage, _this);
                }, 0)
            })(this);


        },

        _handleOpen:function () {
            this._connectAttempts = 0;
            this._connected = true;
            this._defer.resolveWith(this);
        },

        _handleClose:function () {
            if (this._connected && this._fnClose) {
                this._fnClose();
            }
            this._connected = false;
            this._ws = undefined; //@todo Is this usefull?

            if (this._connectAttempts < 10) {
                this._connect();
            }
        },

        _handleMessage:function (e) {
            this._fnMsg.call(null, e.data);
        },

        send:function (msg) {
            this._defer.done(function () {
                this._ws.send(JSON.stringify(msg));
            });
        }

    };

    window.ITW = itw;
    window.itwUtils = {
        transport:transport
    };

})(window, jQuery);