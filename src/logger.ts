export class Logger {
    static debug(msg: string): void {
        if (process.env.DEBUG) {
            console.log('[SQUIRREL:DEBUG] ', msg)
        }
    }

    static log(msg: string): void {
        console.log('[SQUIRREL:LOG] ', msg)
    }
}
