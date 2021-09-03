"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.debug = function (msg) {
        if (process.env.DEBUG) {
            console.log('[SQUIRREL:DEBUG] ', msg);
        }
    };
    Logger.log = function (msg) {
        console.log('[SQUIRREL:LOG] ', msg);
    };
    return Logger;
}());
exports.Logger = Logger;
