"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentPackageVersion = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
function getCurrentPackageVersion() {
    var packageJSON = fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../package.json'), 'utf-8');
    return JSON.parse(packageJSON).version;
}
exports.getCurrentPackageVersion = getCurrentPackageVersion;
