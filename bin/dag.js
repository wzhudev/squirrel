"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CyclicDependencyError = exports.DAG = void 0;
var nodeIdSeed = 0;
function getLinkId(from, to) {
    return from + "-" + to;
}
function getLinkIdFromNodes(from, to) {
    return getLinkId(from.id, to.id);
}
var DAG = /** @class */ (function () {
    function DAG() {
        this.nodes = new Map();
        this.edges = new Map();
    }
    DAG.prototype.get = function (id) {
        return this.nodes.get(id) || null;
    };
    /**
     * add a node to the DAG
     *
     * this method will not check if the node is already in the DAG,
     * if you add a data twice, it will be added twice (as a new node at the second time)
     *
     * @param node the node to add
     */
    DAG.prototype.add = function (data) {
        var newNode = {
            data: data,
            id: nodeIdSeed,
            to: [],
            from: [],
        };
        this.nodes.set(nodeIdSeed, newNode);
        nodeIdSeed++;
        return newNode;
    };
    /**
     * remove a node outside of the DAG, and remove related edges
     * @param node the node to be removed
     */
    DAG.prototype.remove = function (node) {
        var _this = this;
        node.to.forEach(function (l) { return _this.edges.delete(getLinkId(node.id, l)); });
        node.to = [];
        node.from.forEach(function (l) { return _this.edges.delete(getLinkId(l, node.id)); });
        node.from = [];
        this.nodes.delete(node.id);
        return node;
    };
    DAG.prototype.link = function (from, to) {
        var linkKey = getLinkIdFromNodes(from, to);
        if (!this.edges.has(linkKey)) {
            this.assertNoDependency(to, from);
            this.edges.set(linkKey, { from: from.id, to: to.id });
            from.to.push(to.id);
            to.from.push(from.id);
            return true;
        }
        return false;
    };
    DAG.prototype.unlink = function (from, to) {
        var linkKey = getLinkIdFromNodes(from, to);
        if (this.edges.has(linkKey)) {
            this.edges.delete(linkKey);
            from.to = from.to.filter(function (n) { return n !== to.id; });
            to.from = to.from.filter(function (n) { return n !== from.id; });
            return true;
        }
        return false;
    };
    Object.defineProperty(DAG.prototype, "leaves", {
        get: function () {
            return Array.from(this.nodes.values()).filter(this.isLeaf);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DAG.prototype, "roots", {
        get: function () {
            return Array.from(this.nodes.values()).filter(this.isRoot);
        },
        enumerable: false,
        configurable: true
    });
    DAG.prototype.isLeaf = function (node) {
        return node.from.length === 0;
    };
    DAG.prototype.isRoot = function (node) {
        return node.to.length === 0;
    };
    /**
     * topological sorting with no side effect
     */
    DAG.prototype.topologicalSorting = function () {
        var _this = this;
        var inQueue = new Set();
        var resolved = new Set();
        var sorted = [];
        var roots = this.roots;
        roots.forEach(function (n) { return inQueue.add(n.id); });
        var nodeResolved = function (node) {
            if (!node.to.length) {
                return true;
            }
            else if (node.to.every(function (f) { return resolved.has(f); })) {
                return true;
            }
            else {
                return false;
            }
        };
        var queueNodeTo = function (node) {
            if (node.from.length) {
                node.from.forEach(function (t) { return inQueue.add(t); });
            }
        };
        while (inQueue.size) {
            inQueue.forEach(function (id) {
                var node = _this.get(id);
                if (nodeResolved(node)) {
                    sorted.push(node);
                    inQueue.delete(id);
                    resolved.add(id);
                }
                queueNodeTo(node);
            });
        }
        return sorted;
    };
    /**
     * detect if there is a cyclic dependency between from and to using BFS
     *
     * use DFS to report path if there is a cyclic dependency
     *
     * @param node
     * @param visited
     * @param stack
     */
    DAG.prototype.assertNoDependency = function (from, to) {
        var _this = this;
        var visited = new Set();
        var queue = new Array();
        // This is a BFS, may use DFS instead so we could
        // show error message easily
        queue.push(from);
        while (queue.length > 0) {
            var node = queue.shift();
            if (node.id === to.id) {
                var cyclicPath = this.getCyclicPath(from, to);
                throw new CyclicDependencyError(cyclicPath);
            }
            if (!visited.has(node.id)) {
                visited.add(node.id);
                queue.push.apply(queue, node.to.map(function (n) { return _this.nodes.get(n); }));
            }
        }
    };
    DAG.prototype.getCyclicPath = function (from, to) {
        var _this = this;
        if (from.id === to.id) {
            return [to];
        }
        var tos = from.to.map(function (n) { return _this.nodes.get(n); });
        if (tos.length) {
            for (var i = 0; i < tos.length; i++) {
                var path = this.getCyclicPath(tos[i], to);
                if (path) {
                    path.push(tos[i]);
                    return path;
                }
            }
        }
        return null;
    };
    return DAG;
}());
exports.DAG = DAG;
var CyclicDependencyError = /** @class */ (function (_super) {
    __extends(CyclicDependencyError, _super);
    function CyclicDependencyError(path) {
        var _this = _super.call(this, "Cyclic dependency detected: " + path
            .reverse()
            .map(function (n) { return n.id; })
            .join(' -> ')) || this;
        _this.path = path;
        return _this;
    }
    return CyclicDependencyError;
}(Error));
exports.CyclicDependencyError = CyclicDependencyError;
