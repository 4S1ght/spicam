export class FrameBuffer {

    private cursor = 0
    private buf: Buffer

    public get size() { return this.buf.byteLength }

    constructor(size: number) {
        this.buf = Buffer.allocUnsafe(size)
    }

    public write(data: Buffer) {
        data.copy(this.buf, this.cursor)
        this.cursor += data.length
    }

    public readAll() {
        return this.buf.subarray(0, this.cursor)
    }

    public reset() {
        this.cursor = 0
    }

}