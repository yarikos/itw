var undefined
    , fs = require('fs')
    , url = require('url')
    ;


var staticProcessor = function (options) {
    this._imgDir = options.imgDir
}

staticProcessor.prototype = {
    process:function (request, response) {

        var fileName = this._imgDir + request.src;

        console.log('src', request.src);
        console.log('_imgDir', this._imgDir);

        fs.readFile(fileName, function (err, data) {

            if (err) {
                //@todo handle this
                console.log('Error:' + err)
                return;
            }
            response({
                id:request.id,
                data:data
            });
        });
    }
}

module.exports = staticProcessor