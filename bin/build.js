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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var typescript_1 = __importDefault(require("typescript"));
var rollup = __importStar(require("rollup"));
var logger_1 = require("./logger");
var file_1 = require("./utils/file");
var path_2 = require("./utils/path");
var buildGraph_1 = require("./buildGraph");
var RelativeImportOutsideOfEntryPointError = /** @class */ (function (_super) {
    __extends(RelativeImportOutsideOfEntryPointError, _super);
    function RelativeImportOutsideOfEntryPointError(moduleName, containingFile) {
        return _super.call(this, "File \"" + containingFile + "\" resolves a module \"" + moduleName + "\" that is out of the entry point the file belongs to.") || this;
    }
    return RelativeImportOutsideOfEntryPointError;
}(Error));
function beyondRootPath(rootPath, checkingPath) {
    return !checkingPath.startsWith(rootPath);
}
/**
 * an assembly of building tasks including one (or null) primary entry point
 * and many (or null) secondary entry points
 */
var BuildTask = /** @class */ (function () {
    function BuildTask(rootPath, config, moduleName, primaryEntryPoint, secondaryEntryPoints) {
        this.rootPath = rootPath;
        this.config = config;
        this.moduleName = moduleName;
        this.primaryEntryPoint = primaryEntryPoint;
        this.secondaryEntryPoints = secondaryEntryPoints;
    }
    BuildTask.prototype.getAllEntries = function () {
        var _a;
        var entries = [];
        if (this.primaryEntryPoint) {
            entries.push(this.primaryEntryPoint);
        }
        if ((_a = this.secondaryEntryPoints) === null || _a === void 0 ? void 0 : _a.length) {
            entries.push.apply(entries, this.secondaryEntryPoints);
        }
        return entries;
    };
    return BuildTask;
}());
/**
 * @param directoryPath the dir path (maybe) contains a package.json
 * @param isPrimary is resolving primary entry point
 */
function resolveEntryPointConfig(directoryPath, isPrimary) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, fileContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filePath = path_1.default.join(directoryPath, 'package.json');
                    if (!(0, file_1.exist)(filePath)) return [3 /*break*/, 2];
                    return [4 /*yield*/, fs_1.default.promises.readFile(filePath, 'utf-8')];
                case 1:
                    fileContent = _a.sent();
                    return [2 /*return*/, JSON.parse(fileContent)];
                case 2:
                    if (isPrimary) {
                        return [2 /*return*/, null];
                    }
                    else {
                        throw new Error('should not see this error');
                    }
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * resolve tsconfig and compile with especially configured tsconfig
 *
 * @param directoryPath
 * @param isPrimary
 */
function resolveTsConfig(directoryPath, _isPrimary) {
    var tsConfig = typescript_1.default.readConfigFile(directoryPath, typescript_1.default.sys.readFile).config;
    var compilerOptions = typescript_1.default.parseJsonConfigFileContent(tsConfig, typescript_1.default.sys, './');
    return compilerOptions.options;
}
/**
 * build from the path of the primary entry point
 *
 * @param workingPath primary entry (the folder that contains the package.json) path
 */
function build(workingPath) {
    return __awaiter(this, void 0, void 0, function () {
        var task, sortedEntries, _i, sortedEntries_1, entry;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, initBuildTask(workingPath)];
                case 1:
                    task = _a.sent();
                    return [4 /*yield*/, cleanUp(path_1.default.resolve(workingPath, task.config.dest))
                        // TODO: stop execution when analyze failed
                    ];
                case 2:
                    _a.sent();
                    // TODO: stop execution when analyze failed
                    task.getAllEntries().forEach(function (entryPoint) {
                        return analyzeEntryPoint(entryPoint, task.moduleName);
                    });
                    return [4 /*yield*/, scheduleEntryPoint(task)];
                case 3:
                    sortedEntries = _a.sent();
                    _i = 0, sortedEntries_1 = sortedEntries;
                    _a.label = 4;
                case 4:
                    if (!(_i < sortedEntries_1.length)) return [3 /*break*/, 7];
                    entry = sortedEntries_1[_i];
                    return [4 /*yield*/, buildForEntry(entry)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [4 /*yield*/, copyFiles(task)];
                case 8:
                    _a.sent();
                    logger_1.Logger.log('Building finished');
                    return [2 /*return*/];
            }
        });
    });
}
exports.build = build;
function copyFiles(buildTask) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Promise.all(__spreadArray([], buildTask.config.copyFiles.map(function (file) {
                    return fs_1.default.promises.copyFile(path_1.default.resolve(buildTask.rootPath, file), path_1.default.resolve(buildTask.config.dest, file));
                }), true))];
        });
    });
}
function cleanUp(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, fs_1.default.promises.rmdir(path, { recursive: true })];
        });
    });
}
/**
 * perform building
 *
 * @param entry
 */
function buildForEntry(entry) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, buildESM(entry)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, buildUMD(entry)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, buildFESM(entry)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, writePackageJSON(entry)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * perform building to ESM
 *
 * @param entry
 */
function buildESM(entry) {
    return __awaiter(this, void 0, void 0, function () {
        var tsConfig, entryFilePath, compilerHost, program;
        return __generator(this, function (_a) {
            tsConfig = __assign(__assign({ jsx: typescript_1.default.JsxEmit.React, resolve: ['ts', 'tsx', 'js', 'jsx'], skipLibCheck: true, target: typescript_1.default.ScriptTarget.Latest, baseUrl: './', moduleResolution: typescript_1.default.ModuleResolutionKind.NodeJs, declaration: true }, entry.tsConfig), { outDir: entry.fileDestination.esm });
            // filter out dependencies
            if (tsConfig.paths) {
                entry.dependencies.forEach(function (dependency) {
                    if (tsConfig.paths.hasOwnProperty(dependency)) {
                        delete tsConfig.paths[dependency];
                    }
                });
            }
            entryFilePath = entry.entryFilePath;
            compilerHost = typescript_1.default.createCompilerHost(tsConfig);
            program = typescript_1.default.createProgram([entryFilePath], tsConfig, compilerHost);
            program.emit();
            return [2 /*return*/];
        });
    });
}
/**
 * perform building to UMD, use rollup to bundle typescript files
 *
 * @param entry
 */
function buildUMD(entry) {
    return __awaiter(this, void 0, void 0, function () {
        var bundle;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, rollup.rollup({
                        input: entry.fileDestination.esm + "/" + entry.buildConfig.entryFileName.replace(/.ts$/, '.js'),
                        external: function (moduleId) {
                            var ret = entry.dependencies.has(moduleId);
                            return ret;
                        },
                        preserveSymlinks: true,
                        inlineDynamicImports: true,
                        treeshake: false,
                    })];
                case 1:
                    bundle = _a.sent();
                    return [4 /*yield*/, bundle.write({
                            name: entry.modulePath,
                            format: 'umd',
                            file: entry.fileDestination.umd + ".js",
                            sourcemap: true,
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function buildFESM(entry) {
    return __awaiter(this, void 0, void 0, function () {
        var bundle;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, rollup.rollup({
                        input: entry.fileDestination.esm + "/" + entry.buildConfig.entryFileName.replace(/.ts$/, '.js'),
                        external: function (moduleId) { return entry.dependencies.has(moduleId); },
                        preserveSymlinks: true,
                        inlineDynamicImports: true,
                        treeshake: false,
                    })];
                case 1:
                    bundle = _a.sent();
                    return [4 /*yield*/, bundle.write({
                            name: entry.modulePath,
                            format: 'es',
                            file: entry.fileDestination.fesm + ".js",
                            sourcemap: true,
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function writePackageJSON(entry) {
    return __awaiter(this, void 0, void 0, function () {
        var packageJSON, packageJSONObject, toFilterProperties, _i, toFilterProperties_1, prop;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!entry.isPrimary) return [3 /*break*/, 3];
                    return [4 /*yield*/, fs_1.default.promises.readFile(path_1.default.resolve(process.cwd(), 'package.json'), 'utf-8')];
                case 1:
                    packageJSON = _a.sent();
                    if (!packageJSON) return [3 /*break*/, 3];
                    packageJSONObject = JSON.parse(packageJSON);
                    toFilterProperties = [
                        'devDependencies',
                        'squirrel',
                        'scripts',
                        'stylelint',
                        'prettier',
                        'browserslist',
                        'jest',
                        'workspaces',
                        'husky',
                        'main',
                        'module',
                        'typings',
                        'sideEffects',
                    ];
                    for (_i = 0, toFilterProperties_1 = toFilterProperties; _i < toFilterProperties_1.length; _i++) {
                        prop = toFilterProperties_1[_i];
                        if (packageJSONObject.hasOwnProperty(prop)) {
                            delete packageJSONObject[prop];
                        }
                    }
                    packageJSONObject.main = "./dist/" + (0, buildGraph_1.excludeScopeName)(entry.modulePath) + ".js";
                    packageJSONObject.module = "./fesm/" + (0, buildGraph_1.excludeScopeName)(entry.modulePath) + ".js";
                    packageJSONObject.typings = "./esm/" + entry.buildConfig.entryFileName.replace(/.ts$/, '.d.ts');
                    packageJSONObject.sideEffects = false;
                    return [4 /*yield*/, fs_1.default.promises.writeFile(entry.buildConfig.dest + "/package.json", JSON.stringify(packageJSONObject, undefined, 2))];
                case 2: return [2 /*return*/, _a.sent()];
                case 3: 
                // TODO: write secondary package.json
                return [4 /*yield*/, fs_1.default.promises.mkdir("publish/" + entry.modulePath)];
                case 4:
                    // TODO: write secondary package.json
                    _a.sent();
                    return [4 /*yield*/, fs_1.default.promises.writeFile("publish/" + entry.modulePath + "/package.json", JSON.stringify({
                            main: "../dist/" + entry.modulePath + ".js",
                            module: "../fesm/" + entry.modulePath + ".js",
                            typings: "../esm/" + entry.modulePath + "/publicApi.d.ts",
                            sideEffects: false,
                            name: entry.primaryModuleName + "/" + entry.modulePath,
                        }, undefined, 2))];
                case 5: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * add entry points into a BuildGraph to
 *
 * 1. make sure that there's no cyclic dependency
 * 2. decide the building sequence of multiple entry points
 *
 * @param buildTask
 */
function scheduleEntryPoint(buildTask) {
    return __awaiter(this, void 0, void 0, function () {
        var buildGraph, entries;
        return __generator(this, function (_a) {
            buildGraph = new buildGraph_1.BuildGraph();
            entries = buildTask.getAllEntries();
            // first, we just insert all nodes
            entries.forEach(function (entryPoint) { return buildGraph.add(entryPoint); });
            // second, we link dependency relationship for each entry point
            // it would throw error if there's cyclic dependency relationship
            entries.forEach(function (entryPoint) {
                return entryPoint.dependencies.forEach(function (dep) {
                    return buildGraph.link(entryPoint.modulePath, dep);
                });
            });
            // last, we do a topological sorting to get a correct building sequence
            return [2 /*return*/, buildGraph.topologicalSorting()];
        });
    });
}
/**
 * using typescript to validate module resolution in entry points,
 * and find out relationship between entry points
 *
 * @param entryPoint an entry point, primary or secondary
 * @param primaryModuleName
 */
function analyzeEntryPoint(entryPoint, primaryModuleName) {
    return __awaiter(this, void 0, void 0, function () {
        var selfModuleName, entryFilePath, entryRootPath, tsConfig, compilerHost, absoluteImports;
        return __generator(this, function (_a) {
            selfModuleName = entryPoint.modulePath, entryFilePath = entryPoint.entryFilePath;
            entryRootPath = path_1.default.dirname(entryFilePath);
            tsConfig = {
                jsx: typescript_1.default.JsxEmit.React,
                resolve: ['ts', 'tsx', 'js', 'jsx'],
                skipLibCheck: true,
                noEmit: true,
                target: typescript_1.default.ScriptTarget.Latest,
            };
            compilerHost = typescript_1.default.createIncrementalCompilerHost(tsConfig);
            absoluteImports = new Set();
            compilerHost.resolveModuleNames = function (moduleNames, containingFile, _reusedNames, redirectedReference, options) {
                return moduleNames.map(function (moduleName) {
                    if (!(0, path_2.isRelativePath)(moduleName)) {
                        if (moduleName.startsWith(primaryModuleName) &&
                            !moduleName.startsWith(selfModuleName)) {
                            absoluteImports.add(moduleName);
                        }
                        return undefined;
                    }
                    var absolutePath = path_1.default.resolve(path_1.default.dirname(containingFile), moduleName);
                    if (beyondRootPath(entryRootPath, absolutePath)) {
                        console.log(entryRootPath, absolutePath);
                        throw new RelativeImportOutsideOfEntryPointError(moduleName, containingFile);
                    }
                    var resolvedModule = typescript_1.default.resolveModuleName(moduleName, containingFile, options, compilerHost, undefined, redirectedReference).resolvedModule;
                    return resolvedModule;
                });
            };
            compilerHost.resolveTypeReferenceDirectives = function (moduleNames, containingFile, resolveTypeReferenceDirectives, options) {
                return moduleNames.map(function (moduleName) {
                    if (!(0, path_2.isRelativePath)(moduleName)) {
                        if (moduleName.startsWith(primaryModuleName)) {
                            absoluteImports.add(moduleName);
                        }
                        return undefined;
                    }
                    var absolutePath = path_1.default.resolve(containingFile, moduleName);
                    if (beyondRootPath(entryRootPath, absolutePath)) {
                        throw new RelativeImportOutsideOfEntryPointError(moduleName, containingFile);
                    }
                    var resolvedTypeReferenceDirective = typescript_1.default.resolveTypeReferenceDirective(moduleName, containingFile, options, compilerHost, resolveTypeReferenceDirectives).resolvedTypeReferenceDirective;
                    return resolvedTypeReferenceDirective;
                });
            };
            typescript_1.default.createProgram([entryFilePath], tsConfig, compilerHost);
            absoluteImports.forEach(function (dependency) {
                entryPoint.dependentsOn(dependency);
            });
            return [2 /*return*/];
        });
    });
}
var DEFAULT_CONFIG = {
    dest: 'publish',
    entryFileName: 'publicApi.ts',
    srcRoot: 'src',
    tsConfig: 'tsconfig.json',
};
/**
 * init a build task
 * * reading config from package.json
 *
 * @param workingPath
 * @returns
 */
function initBuildTask(workingPath) {
    return __awaiter(this, void 0, void 0, function () {
        var absoluteRootPath, primaryBuildingInfo, config, srcRoot, primaryEntryPoint, primaryModuleName, primaryEntryFilePath, tsConfig, foldersAsSecondaryEntryPoint, secondaryEntryPoints, _i, foldersAsSecondaryEntryPoint_1, secondaryPath, entryFilePath, relativePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger_1.Logger.debug(workingPath);
                    absoluteRootPath = path_1.default.isAbsolute(workingPath)
                        ? workingPath
                        : path_1.default.resolve(workingPath);
                    return [4 /*yield*/, resolveEntryPointConfig(workingPath, true)];
                case 1:
                    primaryBuildingInfo = _a.sent();
                    config = __assign(__assign({}, DEFAULT_CONFIG), primaryBuildingInfo === null || primaryBuildingInfo === void 0 ? void 0 : primaryBuildingInfo.squirrel);
                    srcRoot = path_1.default.resolve(absoluteRootPath, config.srcRoot);
                    primaryModuleName = primaryBuildingInfo.name;
                    primaryEntryFilePath = path_1.default.resolve(absoluteRootPath, config.srcRoot, config.entryFileName);
                    tsConfig = resolveTsConfig(path_1.default.resolve(absoluteRootPath, config.tsConfig), true);
                    if (fs_1.default.existsSync(primaryEntryFilePath)) {
                        primaryEntryPoint = new buildGraph_1.EntryPoint(config, primaryModuleName, tsConfig, primaryModuleName, primaryEntryFilePath, true);
                        logger_1.Logger.debug("found primary entry point at " + primaryEntryFilePath);
                    }
                    else {
                        primaryEntryPoint = null;
                        logger_1.Logger.debug("you are building without a primary entry point");
                    }
                    return [4 /*yield*/, discoverSecondaryEntries(srcRoot)];
                case 2:
                    foldersAsSecondaryEntryPoint = _a.sent();
                    secondaryEntryPoints = [];
                    for (_i = 0, foldersAsSecondaryEntryPoint_1 = foldersAsSecondaryEntryPoint; _i < foldersAsSecondaryEntryPoint_1.length; _i++) {
                        secondaryPath = foldersAsSecondaryEntryPoint_1[_i];
                        entryFilePath = path_1.default.resolve(secondaryPath, config.entryFileName);
                        relativePath = path_1.default.relative(srcRoot, secondaryPath);
                        // TODO: UNIX & windows
                        secondaryEntryPoints.push(new buildGraph_1.EntryPoint(config, "" + (primaryEntryPoint === null || primaryEntryPoint === void 0 ? void 0 : primaryEntryPoint.modulePath), tsConfig, relativePath, entryFilePath, false));
                        logger_1.Logger.debug("found secondary entry point at " + entryFilePath);
                    }
                    return [2 /*return*/, new BuildTask(workingPath, config, primaryModuleName, primaryEntryPoint, secondaryEntryPoints)];
            }
        });
    });
}
function discoverSecondaryEntries(srcRoot, destFolder) {
    if (destFolder === void 0) { destFolder = 'publish'; }
    return __awaiter(this, void 0, void 0, function () {
        var ignore, files;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ignore = [
                        '**/node_modules/**',
                        '**/.git/**',
                        path_1.default.resolve(srcRoot, destFolder) + "/**",
                        srcRoot + "/package.json",
                    ];
                    return [4 /*yield*/, (0, file_1.globFiles)(srcRoot + "/**/package.json", {
                            cwd: srcRoot,
                            nodir: true,
                            ignore: ignore,
                        })];
                case 1:
                    files = _a.sent();
                    return [2 /*return*/, files.map(function (file) { return path_1.default.dirname(file); })];
            }
        });
    });
}
