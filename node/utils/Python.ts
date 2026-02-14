import cp from 'node:child_process'

export default class PythonUtils {

    /**
     * Spawns a simple python script attempting to import the given module by its name.
     * Returns `true` if the module is available, `false` if not.
     */
    public static isAvailable(pythonModule: string) {
        
        const res = cp.spawnSync(
            'python3',
            ['-c', `import ${pythonModule}`],
        );

        return res.status === 0

    }

}