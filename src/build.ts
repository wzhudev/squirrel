import path from 'path'
import fs from 'fs'
import ts from 'typescript'
import * as rollup from 'rollup'

import { SquirrelPackagingConfig } from './schema/squirrel.schema'
import { Logger } from './logger'
import { exist, globFiles } from './utils/file'
import { isRelativePath } from './utils/path'
import { EntryPoint, BuildGraph, excludeScopeName } from './buildGraph'

class RelativeImportOutsideOfEntryPointError extends Error {
    constructor(moduleName: string, containingFile: string) {
        super(
            `File "${containingFile}" resolves a module "${moduleName}" that is out of the entry point the file belongs to.`
        )
    }
}

function beyondRootPath(rootPath: string, checkingPath: string) {
    return !checkingPath.startsWith(rootPath)
}

/**
 * an assembly of building tasks including one (or null) primary entry point
 * and many (or null) secondary entry points
 */
class BuildTask {
    constructor(
        public readonly rootPath: string,
        public readonly config: Required<SquirrelPackagingConfig>,
        public readonly moduleName: string,
        public readonly primaryEntryPoint: EntryPoint | null,
        public readonly secondaryEntryPoints: EntryPoint[] | null
    ) { }

    getAllEntries(): EntryPoint[] {
        const entries = []

        if (this.primaryEntryPoint) {
            entries.push(this.primaryEntryPoint)
        }

        if (this.secondaryEntryPoints?.length) {
            entries.push(...this.secondaryEntryPoints)
        }

        return entries
    }
}

/**
 * @param directoryPath the dir path (maybe) contains a package.json
 * @param isPrimary is resolving primary entry point
 */
async function resolveEntryPointConfig(
    directoryPath: string,
    isPrimary: boolean
): Promise<any> {
    const filePath = path.join(directoryPath, 'package.json')

    if (exist(filePath)) {
        const fileContent = await fs.promises.readFile(filePath, 'utf-8')
        return JSON.parse(fileContent)
    } else if (isPrimary) {
        return null
    } else {
        throw new Error('should not see this error')
    }
}

/**
 * resolve tsconfig and compile with especially configured tsconfig
 *
 * @param directoryPath
 * @param isPrimary
 */
function resolveTsConfig(directoryPath: string, _isPrimary: boolean) {
    const tsConfig = ts.readConfigFile(directoryPath, ts.sys.readFile).config
    const compilerOptions = ts.parseJsonConfigFileContent(
        tsConfig,
        ts.sys,
        './'
    )
    return compilerOptions.options
}

/**
 * build from the path of the primary entry point
 * 
 * @main
 * @param workingPath primary entry (the folder that contains the package.json) path
 */
export async function build(workingPath: string) {
    const task = await initBuildTask(workingPath)

    await cleanUp(path.resolve(workingPath, task.config.dest))

    const externalDependencies = await readExternalDependencies()

    // TODO: stop execution when analyze failed
    // TODO: parallelism
    task.getAllEntries().forEach((entryPoint) =>
        analyzeEntryPoint(entryPoint, task.moduleName, externalDependencies)
    )

    const sortedEntries = await scheduleEntryPoint(task)
    for (const entry of sortedEntries) {
        await buildForEntry(entry)
    }

    await writeExports(task)
    await copyFiles(task)

    Logger.log('Building finished')
}

/**
 * write "exports" field in the package.json of the primary entry point
 * @param buildTask
 */
async function writeExports(buildTask: BuildTask) {
    const exportsInfo = buildTask.secondaryEntryPoints?.reduce((acc, entry) => {
        (acc[`./${entry.modulePath}`] = {
            // main: `../dist/${entry.modulePath}.js`,
            // module: `../fesm/${entry.modulePath}.js`,
            // typings: `../esm/${entry.modulePath}/publicApi.d.ts`,
            import: `./fesm/${entry.modulePath}.js`,
            require: `./dist/${entry.modulePath}.js`,
            types: `./esm/${entry.modulePath}/publicApi.d.ts`,
        });

        return acc;
    }, {} as Record<string, any>)

    console.log('exportsInfo', JSON.stringify(exportsInfo, null, 2))
    let packageJSON = await fs.promises.readFile(
        path.resolve(process.cwd(), 'publish/package.json'),
        'utf-8'
    )

    if (packageJSON) {
        const packageJSONObject = JSON.parse(packageJSON)
        const entry = buildTask.primaryEntryPoint!

        exportsInfo!['./package.json'] = './package.json'
        exportsInfo!['.'] = {
            "import": `./fesm/${excludeScopeName(
                entry.modulePath
            )}.js`,
            "require": `./dist/${excludeScopeName(
                entry.modulePath
            )}.js`,
            "types": `./esm/publicApi.d.ts`
        }
        packageJSONObject.exports = exportsInfo

        return await fs.promises.writeFile(
            `${entry.buildConfig.dest}/package.json`,
            JSON.stringify(packageJSONObject, undefined, 2)
        )
    }
}

async function copyFiles(buildTask: BuildTask) {
    return Promise.all([
        ...buildTask.config.copyFiles.map((file) =>
            fs.promises.copyFile(
                path.resolve(buildTask.rootPath, file),
                path.resolve(buildTask.config.dest, file)
            )
        ),
    ])
}

async function cleanUp(path: string) {
    return fs.promises.rmdir(path, { recursive: true })
}

/**
 * perform building
 *
 * @param entry
 */
async function buildForEntry(entry: EntryPoint): Promise<void> {
    await buildESM(entry)
    await buildUMD(entry)
    await buildFESM(entry)
    await writePackageJSON(entry)
}

/**
 * perform building to ESM
 *
 * @param entry
 */
async function buildESM(entry: EntryPoint): Promise<void> {
    const tsConfig = {
        jsx: ts.JsxEmit.React,
        resolve: ['ts', 'tsx', 'js', 'jsx'],
        skipLibCheck: true,
        target: ts.ScriptTarget.Latest,
        baseUrl: './',
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        declaration: true,
        ...entry.tsConfig,
        outDir: entry.fileDestination.esm,
    }

    // filter out dependencies
    if (tsConfig.paths) {
        entry.dependencies.forEach((dependency) => {
            if (tsConfig.paths!.hasOwnProperty(dependency)) {
                delete tsConfig.paths![dependency]
            }
        })
    }

    const entryFilePath = entry.entryFilePath
    const compilerHost = ts.createCompilerHost(tsConfig)
    const program = ts.createProgram([entryFilePath], tsConfig, compilerHost)

    program.emit()
}

/**
 * perform building to UMD, use rollup to bundle typescript files
 *
 * @param entry
 */
async function buildUMD(entry: EntryPoint): Promise<void> {
    const bundle = await rollup.rollup({
        input: `${entry.fileDestination.esm
            }/${entry.buildConfig.entryFileName.replace(/.ts$/, '.js')}`,
        external: (moduleId) => {
            const isFromAnotherEntryPoint = entry.dependencies.has(moduleId)
            if (!isFromAnotherEntryPoint) {
                return entry.externalDependencies.has(moduleId)
            }

            return isFromAnotherEntryPoint;
        },
        preserveSymlinks: true,
        inlineDynamicImports: true,
        treeshake: false,
    })

    await bundle.write({
        name: entry.modulePath,
        format: 'umd',
        file: `${entry.fileDestination.umd}.js`,
        sourcemap: true,
    })
}

async function buildFESM(entry: EntryPoint): Promise<void> {
    const bundle = await rollup.rollup({
        input: `${entry.fileDestination.esm
            }/${entry.buildConfig.entryFileName.replace(/.ts$/, '.js')}`,
        external: (moduleId) => {
            const isFromAnotherEntryPoint = entry.dependencies.has(moduleId)
            if (!isFromAnotherEntryPoint) {
                return entry.externalDependencies.has(moduleId)
            }

            return isFromAnotherEntryPoint;
        },
        preserveSymlinks: true,
        inlineDynamicImports: true,
        treeshake: false,
    })

    await bundle.write({
        name: entry.modulePath,
        format: 'es',
        file: `${entry.fileDestination.fesm}.js`,
        sourcemap: true,
    })
}

async function writePackageJSON(entry: EntryPoint): Promise<void> {
    if (entry.isPrimary) {
        let packageJSON = await fs.promises.readFile(
            path.resolve(process.cwd(), 'package.json'),
            'utf-8'
        )
        if (packageJSON) {
            const packageJSONObject = JSON.parse(packageJSON)

            const toFilterProperties = [
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
            ]
            for (const prop of toFilterProperties) {
                if (packageJSONObject.hasOwnProperty(prop)) {
                    delete packageJSONObject[prop]
                }
            }

            packageJSONObject.main = `./dist/${excludeScopeName(
                entry.modulePath
            )}.js`
            packageJSONObject.module = `./fesm/${excludeScopeName(
                entry.modulePath
            )}.js`
            packageJSONObject.typings = `./esm/${entry.buildConfig.entryFileName.replace(
                /.ts$/,
                '.d.ts'
            )}`
            packageJSONObject.sideEffects = false

            return await fs.promises.writeFile(
                `${entry.buildConfig.dest}/package.json`,
                JSON.stringify(packageJSONObject, undefined, 2)
            )
        }
    }

    await fs.promises.mkdir(`publish/${entry.modulePath}`)

    return await fs.promises.writeFile(
        `publish/${entry.modulePath}/package.json`,
        JSON.stringify(
            {
                // TODO@huwenzhao: not working for deeply wrapped sub folders
                main: `../dist/${entry.modulePath}.js`,
                module: `../fesm/${entry.modulePath}.js`,
                typings: `../esm/${entry.modulePath}/publicApi.d.ts`,
                sideEffects: false,
                name: `${entry.primaryModuleName}/${entry.modulePath}`,
            },
            undefined,
            2
        )
    )
}

/**
 * add entry points into a BuildGraph to
 *
 * 1. make sure that there's no cyclic dependency
 * 2. decide the building sequence of multiple entry points
 *
 * @param buildTask
 */
async function scheduleEntryPoint(buildTask: BuildTask): Promise<EntryPoint[]> {
    const buildGraph = new BuildGraph()
    const entries = buildTask.getAllEntries()

    // first, we just insert all nodes
    entries.forEach((entryPoint) => buildGraph.add(entryPoint))
    // second, we link dependency relationship for each entry point
    // it would throw error if there's cyclic dependency relationship
    entries.forEach((entryPoint) =>
        entryPoint.dependencies.forEach((dep) =>
            buildGraph.link(entryPoint.modulePath, dep)
        )
    )
    // last, we do a topological sorting to get a correct building sequence
    return buildGraph.topologicalSorting()
}

/**
 * using typescript to validate module resolution in entry points,
 * and find out relationship between entry points
 *
 * @param entryPoint an entry point, primary or secondary
 * @param primaryModuleName
 */
async function analyzeEntryPoint(
    entryPoint: EntryPoint,
    primaryModuleName: string,
    externalDependencies: string[]
) {
    const { modulePath: selfModuleName, entryFilePath } = entryPoint
    const entryRootPath = path.dirname(entryFilePath)

    const tsConfig = {
        jsx: ts.JsxEmit.React,
        resolve: ['ts', 'tsx', 'js', 'jsx'],
        skipLibCheck: true,
        noEmit: true, // do emit anything here, we are just checking it could build
        target: ts.ScriptTarget.Latest,
    }
    const compilerHost = ts.createIncrementalCompilerHost(tsConfig)

    // record external dependencies
    externalDependencies.forEach(e => entryPoint.dependentsOnExternal(e))

    console.log('external dependencies', externalDependencies)

    // we hook typescript compiler here to do two things
    // 1. find any potential dependencies that may be another entry points
    // 2. check relative imports, see if there's any importing outside the current entry point (forbidden)
    // do these for importing modules and (maybe not) type declarations
    const absoluteImports = new Set<string>()

    compilerHost.resolveModuleNames = (
        moduleNames: string[],
        containingFile: string,
        _reusedNames: string[] | undefined,
        redirectedReference: ts.ResolvedProjectReference | undefined,
        options: ts.CompilerOptions
    ) => {
        return moduleNames.map((moduleName) => {
            if (!isRelativePath(moduleName)) {
                if (
                    moduleName.startsWith(primaryModuleName) &&
                    !moduleName.startsWith(selfModuleName)
                ) {
                    absoluteImports.add(moduleName)
                }

                return undefined
            }

            const absolutePath = path.resolve(
                path.dirname(containingFile),
                moduleName
            )
            if (beyondRootPath(entryRootPath, absolutePath)) {
                throw new RelativeImportOutsideOfEntryPointError(
                    moduleName,
                    containingFile
                )
            }

            const { resolvedModule } = ts.resolveModuleName(
                moduleName,
                containingFile,
                options,
                compilerHost,
                undefined,
                redirectedReference
            )

            return resolvedModule
        })
    }

    compilerHost.resolveTypeReferenceDirectives = (
        moduleNames: string[],
        containingFile: string,
        resolveTypeReferenceDirectives: ts.ResolvedProjectReference | undefined,
        options: ts.CompilerOptions
    ) => {
        return moduleNames.map((moduleName) => {
            if (!isRelativePath(moduleName)) {
                if (moduleName.startsWith(primaryModuleName)) {
                    absoluteImports.add(moduleName)
                }

                return undefined
            }

            const absolutePath = path.resolve(containingFile, moduleName)
            if (beyondRootPath(entryRootPath, absolutePath)) {
                throw new RelativeImportOutsideOfEntryPointError(
                    moduleName,
                    containingFile
                )
            }

            const { resolvedTypeReferenceDirective } =
                ts.resolveTypeReferenceDirective(
                    moduleName,
                    containingFile,
                    options,
                    compilerHost,
                    resolveTypeReferenceDirectives
                )

            return resolvedTypeReferenceDirective
        })
    }

    ts.createProgram([entryFilePath], tsConfig, compilerHost)

    absoluteImports.forEach((dependency) => {
        entryPoint.dependentsOn(dependency)
    })
}

const DEFAULT_CONFIG: SquirrelPackagingConfig = {
    dest: 'publish',
    entryFileName: 'publicApi.ts',
    srcRoot: 'src',
    tsConfig: 'tsconfig.json',
}

/**
 * init a build task
 * * reading config from package.json
 *
 * @param workingPath
 * @returns
 */
async function initBuildTask(workingPath: string): Promise<BuildTask> {
    Logger.debug(workingPath)

    const absoluteRootPath = path.isAbsolute(workingPath)
        ? workingPath
        : path.resolve(workingPath)
    const primaryBuildingInfo = await resolveEntryPointConfig(workingPath, true)

    const config: Required<SquirrelPackagingConfig> = {
        ...DEFAULT_CONFIG,
        ...primaryBuildingInfo?.squirrel,
    }

    const srcRoot = path.resolve(absoluteRootPath, config.srcRoot)

    let primaryEntryPoint: null | EntryPoint

    const primaryModuleName = primaryBuildingInfo.name
    const primaryEntryFilePath = path.resolve(
        absoluteRootPath,
        config.srcRoot,
        config.entryFileName
    )

    const tsConfig = resolveTsConfig(
        path.resolve(absoluteRootPath, config.tsConfig),
        true
    )

    if (fs.existsSync(primaryEntryFilePath)) {
        primaryEntryPoint = new EntryPoint(
            config,
            primaryModuleName,
            tsConfig,
            primaryModuleName,
            primaryEntryFilePath,
            true
        )
        Logger.debug(`found primary entry point at ${primaryEntryFilePath}`)
    } else {
        primaryEntryPoint = null
        Logger.debug(`you are building without a primary entry point`)
    }

    const foldersAsSecondaryEntryPoint = await discoverSecondaryEntries(srcRoot)
    const secondaryEntryPoints: EntryPoint[] = []
    for (const secondaryPath of foldersAsSecondaryEntryPoint) {
        const entryFilePath = path.resolve(secondaryPath, config.entryFileName)
        const relativePath = path.relative(srcRoot, secondaryPath)

        // TODO: UNIX & windows
        secondaryEntryPoints.push(
            new EntryPoint(
                config,
                `${primaryEntryPoint?.modulePath}`,
                tsConfig,
                relativePath,
                entryFilePath,
                false
            )
        )

        Logger.debug(`found secondary entry point at ${entryFilePath}`)
    }

    return new BuildTask(
        workingPath,
        config,
        primaryModuleName,
        primaryEntryPoint,
        secondaryEntryPoints
    )
}

async function discoverSecondaryEntries(
    srcRoot: string,
    destFolder = 'publish'
) {
    const ignore = [
        '**/node_modules/**',
        '**/.git/**',
        `${path.resolve(srcRoot, destFolder)}/**`,
        `${srcRoot}/package.json`,
    ]
    const files = await globFiles(`${srcRoot}/**/package.json`, {
        cwd: srcRoot,
        nodir: true,
        ignore,
    })

    return files.map((file) => path.dirname(file))
}

async function readExternalDependencies(): Promise<string[]> {
    let packageJSON = await fs.promises.readFile(
        path.resolve(process.cwd(), 'package.json'),
        'utf-8'
    )

    if (packageJSON) {
        const packageJSONObject = JSON.parse(packageJSON)
        const externalPackages = [];

        if (packageJSONObject.dependencies) {
            externalPackages.push(...Object.keys(packageJSONObject.dependencies))
        }
        if (packageJSONObject.peerDependencies) {
            externalPackages.push(...Object.keys(packageJSONObject.peerDependencies))
        }

        return externalPackages
    }

    return [];
}