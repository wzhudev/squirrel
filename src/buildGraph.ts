import ts from 'typescript'
import { DAG, Node } from './dag'
import { SquirrelPackagingConfig } from './schema/squirrel.schema'

/**
 * specify where the build production would be put
 */
interface EntryPointDestination {
    /** umd file name */
    umd: string
    /** esm folder name */
    esm: string
    /** fesm file name */
    fesm: string
}

export class EntryPoint {
    public readonly dependencies: Set<string> = new Set()

    public readonly fileDestination: EntryPointDestination

    constructor(
        public readonly buildConfig: Required<SquirrelPackagingConfig>,
        public readonly primaryModuleName: string,
        public readonly tsConfig: ts.CompilerOptions,
        public readonly modulePath: string,
        public readonly entryFilePath: string,
        public readonly isPrimary: boolean
    ) {
        this.fileDestination = this.buildFileDestination()
    }

    public buildFileDestination(): EntryPointDestination {
        const { dest } = this.buildConfig

        if (this.isPrimary) {
            return {
                umd: `${dest}/dist/${this.modulePath}`,
                esm: `${dest}/esm`,
                fesm: `${dest}/fesm/${this.modulePath}`,
            }
        }

        const moduleName = transformModulePathToModuleName(this.modulePath)
        return {
            umd: `${dest}/dist/${moduleName}`,
            esm: `${dest}/esm/${moduleName}`,
            fesm: `${dest}/fesm/${moduleName}`,
        }
    }

    public dependentsOn(dependentModuleName: string): void {
        this.dependencies.add(dependentModuleName)
    }
}

/**
 * a wrapper on DAG to make it user-friendly for resolving module
 * dependency relationship
 */
export class BuildGraph {
    private readonly graph = new DAG<EntryPoint>()
    private readonly moduleNameToNodeId = new Map<string, number>()

    public add(entry: EntryPoint): void {
        const newNode = this.graph.add(entry)
        this.moduleNameToNodeId.set(entry.modulePath, newNode.id)
    }

    public link(from: string, to: string): void {
        this.graph.link(this.resolveModule(from), this.resolveModule(to))
    }

    public topologicalSorting(): EntryPoint[] {
        return this.graph.topologicalSorting().map((node) => node.data)
    }

    private resolveModule(moduleName: string): Node<EntryPoint> {
        const id = this.moduleNameToNodeId.get(moduleName)!
        const node = this.graph.get(id)!
        return node
    }
}

function transformModulePathToModuleName(modulePath: string): string {
    return modulePath.replace(/\//g, '-')
}