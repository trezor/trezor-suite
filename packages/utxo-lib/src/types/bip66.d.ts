declare module 'bip66' {
    function check(buffer: Buffer): boolean;
    function decode(buffer: Buffer): { r: Buffer; s: Buffer };
    function encode(r: Buffer, s: Buffer): Buffer;
}
