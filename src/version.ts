import fs from 'fs'
import path from 'path'

export function getCurrentPackageVersion(): string {
    const packageJSON = fs.readFileSync(
        path.resolve(__dirname, '../package.json'),
        'utf-8'
    )
    return JSON.parse(packageJSON).version
}
