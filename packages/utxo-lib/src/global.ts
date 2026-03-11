declare module 'bip66' {
    function check(buffer: Buffer): boolean;
    function decode(buffer: Buffer): { r: Buffer; s: Buffer };
    function encode(r: Buffer, s: Buffer): Buffer;
}

declare module 'bitcoin-ops';

declare module 'minimaldata';

declare module 'tiny-secp256k1';

declare module 'pushdata-bitcoin' {
    function encodingLength(len: number): number;
    function encode(buffer: Buffer, number: number, offset: number): number;
    function decode(
        buffer: Buffer,
        offset: number,
    ): { opcode: number; number: number; size: number };
}

declare module 'blake-hash';
