import fs from 'node:fs/promises'

export default new class FSUtils {

    public exists = async (path: string) => {
        try {
            await fs.access(path)
            return true
        } 
        catch {
            return false
        }
    }

}