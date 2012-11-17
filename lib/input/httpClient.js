var
    undefined
    , http = require('http-get')
    ;


httpClient = function (options) {

    this._url = options.url; //@todo throw the exception unless is defined,
    this._cache = options.cache || null;
};


httpClient.prototype = {
    _url:undefined,
    _cache:undefined,

    process:function (request, response) {


        if (this._cache && this._cache.get(request.src, function (data) {
            response({
                id:request.id,
                data:data
            });
        })) {
            console.log('cache hit', request.src)
            return;
        }
        console.log('cache miss', request.src)


        var options = {
            url:request.src,
            bufferType:'buffer'
            },
            cache = this._cache;

        http.get(options, function (error, result) {
            if (error) {
                //@todo handle this
                console.error(error);

            } else {

                if (cache) {
                    console.log('cache write', request.src)
                    cache.set(request.src, result.buffer);
                }

                response({
                    id:request.id,
                    data:result.buffer
                });
            }
        });
    }

};


module.exports = httpClient;