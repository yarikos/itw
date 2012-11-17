function OutByte() {

}


OutByte.prototype = {

    createAnswerFunc:function (connection) {
        return function (answer) {

            var responseBuffer, msgIdBuffer, responseBuffer;

            msgIdBuffer = new Buffer(4);
            msgIdBuffer.writeUInt32LE(answer.id, 0);

            responseBuffer = Buffer.concat([answer.data, msgIdBuffer]);

            connection.send(responseBuffer);
        }
    }
}


module.exports = OutByte;