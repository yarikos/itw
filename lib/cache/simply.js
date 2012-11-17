var md5 = require('MD5');


var SimplyCache = function () {
    this.vals = {};
};


SimplyCache.prototype = {

    _dir:null,

    get:function (key, fn) {
        var _this = this;

        key = md5(key);

        if (this.vals[key]) {
            setTimeout(function () {
                fn(_this.vals[key]);
            }, 0);
            return true;
        }
        return false;
    },

    set:function (key, buffer, fn) {

        key = md5(key);

        if (fn) {
            setTimeout(function () {
                fn();
            }, 0);
        }
        this.vals[key] = buffer;
        return true;
    }

}


module.exports = SimplyCache