"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.excludeScopeName = exports.BuildGraph = exports.EntryPoint = void 0;
var dag_1 = require("./dag");
var EntryPoint = /** @class */ (function () {
    function EntryPoint(buildConfig, primaryModuleName, tsConfig, modulePath, entryFilePath, isPrimary) {
        this.buildConfig = buildConfig;
        this.primaryModuleName = primaryModuleName;
        this.tsConfig = tsConfig;
        this.modulePath = modulePath;
        this.entryFilePath = entryFilePath;
        this.isPrimary = isPrimary;
        this.dependencies = new Set();
        this.fileDestination = this.buildFileDestination();
    }
    EntryPoint.prototype.buildFileDestination = function () {
        var dest = this.buildConfig.dest;
        if (this.isPrimary) {
            var path = excludeScopeName(this.modulePath);
            return {
                umd: dest + "/dist/" + path,
                esm: dest + "/esm",
                fesm: dest + "/fesm/" + path,
            };
        }
        var moduleName = transformModulePathToModuleName(this.modulePath);
        return {
            umd: dest + "/dist/" + moduleName,
            esm: dest + "/esm/" + moduleName,
            fesm: dest + "/fesm/" + moduleName,
        };
    };
    EntryPoint.prototype.dependentsOn = function (dependentModuleName) {
        this.dependencies.add(dependentModuleName);
    };
    return EntryPoint;
}());
exports.EntryPoint = EntryPoint;
/**
 * a wrapper on DAG to make it user-friendly for resolving module
 * dependency relationship
 */
var BuildGraph = /** @class */ (function () {
    function BuildGraph() {
        this.graph = new dag_1.DAG();
        this.moduleNameToNodeId = new Map();
    }
    BuildGraph.prototype.add = function (entry) {
        var newNode = this.graph.add(entry);
        this.moduleNameToNodeId.set(entry.modulePath, newNode.id);
    };
    BuildGraph.prototype.link = function (from, to) {
        this.graph.link(this.resolveModule(from), this.resolveModule(to));
    };
    BuildGraph.prototype.topologicalSorting = function () {
        return this.graph.topologicalSorting().map(function (node) { return node.data; });
    };
    BuildGraph.prototype.resolveModule = function (moduleName) {
        var id = this.moduleNameToNodeId.get(moduleName);
        var node = this.graph.get(id);
        return node;
    };
    return BuildGraph;
}());
exports.BuildGraph = BuildGraph;
function transformModulePathToModuleName(modulePath) {
    return modulePath.replace(/\//g, '-');
}
function excludeScopeName(nameWithScope) {
    if (nameWithScope.startsWith('@')) {
        return nameWithScope.split('/')[1];
    }
    else {
        return nameWithScope;
    }
}
exports.excludeScopeName = excludeScopeName;
