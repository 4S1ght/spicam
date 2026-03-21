
export function size(bytes: number) {
    
    if (bytes === 0) return '0 B'

    const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const value = bytes / (1024 ** i)

    return value.toFixed(value >= 10 || i === 0 ? 0 : 1) + ' ' + units[i]

}
