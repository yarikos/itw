module.exports =
{
    server:require('./server.js'),

    input:{
        static:require('./input/static.js'),
        httpClient:require('./input/httpClient.js')
    },

    output:{
        base64:require('./output/base64.js'),
        byte:require('./output/byte.js')
    },

    cache:{
        simply:require('./cache/simply.js')
    }
}
