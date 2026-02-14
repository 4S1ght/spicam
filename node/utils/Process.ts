
export default class ProcessUtils {

    public static delayedExit(delay: number, code: number) {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => process.exit(code), delay)
        })
    }


}