var
websocket = require('websocket')
, imgDir,
static = require('./input/static.js')


module.exports = Server;


function Server() {
}

Server.prototype = {

    _inputs:{},

    attachToHttp:function (httpServer, options) {
        // @todo add checking

        var _this = this;

        new websocket.server({
            httpServer:httpServer
        }).on('request', function (request) {
            //console.log('request')
            _this.process(request)
        });
        return this;
    },


    attachInput:function (route, input) {
        this._inputs[route] = input;
        return this;
    },

    attachOutput:function (output) {

        //temporary wrap to log answers
        var _answer = output.answer
        output.answer = function () {
            _answer.apply(this, arguments)
        }

        this._output = output;
        return this;
    },

    process:function (request) {

        var connection = request.accept(null, request.origin);

        //console.log(request.resource, connection)
        //console.log(connection.remoteAddress)

        var _this = this;
        var input = this._selectInput(request);
        if (!input) {
            console.log('Route not found:' + request.resource)
            connection.close();
            return;
        }
        connection.on('message', function (message) {
            //console.log('message')
            if (message.type !== 'utf8') {
                //@todo handle this
                return;
            }

            var msg = JSON.parse(message.utf8Data);
            msg.resource = connection.remoteAddress;

            input.process(msg, _this._output.createAnswerFunc(connection));
        });

        connection.on('close', function (connection) {
            // close user connection
            });

    },

    _selectInput:function (request) {
        var route = request.resource.replace(/^\/([^/]+).+/, '$1')
        if (this._inputs[route]) {
            return this._inputs[route];
        }
        return false;
    }
}


inputs = [];
output = [];