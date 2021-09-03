"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRelativePath = void 0;
function isRelativePath(p) {
    return p.startsWith('.');
}
exports.isRelativePath = isRelativePath;
