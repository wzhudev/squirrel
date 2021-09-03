import fs from 'fs'
import glob from 'glob'
import { promisify } from 'util'

export function exist(filePath: string): boolean {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile()
}

const promisifiedGlob = promisify(glob)
export async function globFiles(pattern: string, options?: glob.IOptions): Promise<string[]> {
    const files = await Promise.all([pattern].map((pattern) => promisifiedGlob(pattern, options)))
    return files.flatMap((x) => x)
}
