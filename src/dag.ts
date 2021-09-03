export interface Node<T> {
    id: number
    to: number[]
    from: number[]

    data: T
}

export interface Link {
    from: number
    to: number
}

let nodeIdSeed = 0

function getLinkId(from: number, to: number): string {
    return `${from}-${to}`
}

function getLinkIdFromNodes<T>(from: Node<T>, to: Node<T>): string {
    return getLinkId(from.id, to.id)
}

export class DAG<T> {
    private readonly nodes = new Map<number, Node<T>>()
    private readonly edges = new Map<string, Link>()

    public get(id: number): Node<T> | null {
        return this.nodes.get(id) || null
    }

    /**
     * add a node to the DAG
     *
     * this method will not check if the node is already in the DAG,
     * if you add a data twice, it will be added twice (as a new node at the second time)
     *
     * @param node the node to add
     */
    public add(data: T): Node<T> {
        const newNode = {
            data,
            id: nodeIdSeed,
            to: [],
            from: [],
        }
        this.nodes.set(nodeIdSeed, newNode)
        nodeIdSeed++

        return newNode
    }

    /**
     * remove a node outside of the DAG, and remove related edges
     * @param node the node to be removed
     */
    public remove(node: Node<T>): Node<T> {
        node.to.forEach((l) => this.edges.delete(getLinkId(node.id, l)))
        node.to = []
        node.from.forEach((l) => this.edges.delete(getLinkId(l, node.id)))
        node.from = []

        this.nodes.delete(node.id)

        return node
    }

    public link(from: Node<T>, to: Node<T>): boolean {
        const linkKey = getLinkIdFromNodes(from, to)
        if (!this.edges.has(linkKey)) {
            this.assertNoDependency(to, from)

            this.edges.set(linkKey, { from: from.id, to: to.id })
            from.to.push(to.id)
            to.from.push(from.id)
            return true
        }

        return false
    }

    public unlink(from: Node<T>, to: Node<T>): boolean {
        const linkKey = getLinkIdFromNodes(from, to)
        if (this.edges.has(linkKey)) {
            this.edges.delete(linkKey)
            from.to = from.to.filter((n) => n !== to.id)
            to.from = to.from.filter((n) => n !== from.id)
            return true
        }

        return false
    }

    public get leaves(): Node<T>[] {
        return Array.from(this.nodes.values()).filter(this.isLeaf)
    }

    public get roots(): Node<T>[] {
        return Array.from(this.nodes.values()).filter(this.isRoot)
    }

    public isLeaf(node: Node<T>): boolean {
        return node.from.length === 0
    }

    public isRoot(node: Node<T>): boolean {
        return node.to.length === 0
    }

    /**
     * topological sorting with no side effect
     */
    public topologicalSorting(): Node<T>[] {
        const inQueue = new Set<number>()
        const resolved = new Set<number>()
        const sorted: Node<T>[] = []

        const roots = this.roots
        roots.forEach((n) => inQueue.add(n.id))

        const nodeResolved = (node: Node<T>): boolean => {
            if (!node.to.length) {
                return true
            } else if (node.to.every((f) => resolved.has(f))) {
                return true
            } else {
                return false
            }
        }

        const queueNodeTo = (node: Node<T>): void => {
            if (node.from.length) {
                node.from.forEach((t) => inQueue.add(t))
            }
        }

        while (inQueue.size) {
            inQueue.forEach((id) => {
                const node = this.get(id)!

                if (nodeResolved(node)) {
                    sorted.push(node)
                    inQueue.delete(id)
                    resolved.add(id)
                }

                queueNodeTo(node)
            })
        }

        return sorted
    }

    /**
     * detect if there is a cyclic dependency between from and to using BFS
     *
     * use DFS to report path if there is a cyclic dependency
     *
     * @param node
     * @param visited
     * @param stack
     */
    private assertNoDependency(from: Node<T>, to: Node<T>): void {
        const visited = new Set<number>()
        const queue = new Array<Node<T>>()

        // This is a BFS, may use DFS instead so we could
        // show error message easily
        queue.push(from)

        while (queue.length > 0) {
            const node = queue.shift()!
            if (node.id === to.id) {
                const cyclicPath = this.getCyclicPath(from, to)!
                throw new CyclicDependencyError(cyclicPath)
            }

            if (!visited.has(node.id)) {
                visited.add(node.id)
                queue.push(...node.to.map((n) => this.nodes.get(n)!))
            }
        }
    }

    private getCyclicPath(from: Node<T>, to: Node<T>): Node<T>[] | null {
        if (from.id === to.id) {
            return [to]
        }

        const tos = from.to.map((n) => this.nodes.get(n)!)
        if (tos.length) {
            for (let i = 0; i < tos.length; i++) {
                const path = this.getCyclicPath(tos[i], to)
                if (path) {
                    path.push(tos[i])
                    return path
                }
            }
        }

        return null
    }
}

export class CyclicDependencyError<T> extends Error {
    constructor(public readonly path: Node<T>[]) {
        super(
            `Cyclic dependency detected: ${path
                .reverse()
                .map((n) => n.id)
                .join(' -> ')}`
        )
    }
}
