function OutBase64() {

}


OutBase64.prototype = {

    createAnswerFunc:function (connection) {
        return function (answer) {

            var file = answer.data.toString('base64'),
                msg = JSON.stringify({
                    id:answer.id,
                    data:file
                });
            connection.sendUTF(msg);
        }
    }
}


module.exports = OutBase64;