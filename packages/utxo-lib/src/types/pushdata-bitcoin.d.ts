declare module 'pushdata-bitcoin' {
    function encodingLength(len: number): number;
    function encode(buffer: Buffer, number: number, offset: number): number;
    function decode(
        buffer: Buffer,
        offset: number,
    ): { opcode: number; number: number; size: number };
}
