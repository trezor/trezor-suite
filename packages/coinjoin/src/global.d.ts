/* eslint-disable @typescript-eslint/ban-types */

declare module 'golomb' {
    class Golomb {
        constructor();
        n: Number;
        p: Number;
        m: Number;
        data: Buffer;
        match(key: Buffer, script: Buffer): boolean;
        matchAny(key: Buffer, items: Buffer[]): boolean;
        static fromItems(P: Number, key: Buffer, items: Buffer[]): Golomb;
        static fromBytes(N: Number, P: Number, data: Buffer): Golomb;
        static fromNBytes(P: Number, data: Buffer): Golomb;
        static fromPBytes(N: Number, data: Buffer): Golomb;
        static fromNPBytes(data: Buffer): Golomb;
        static fromRaw(data: Buffer): Golomb;
    }
    export = Golomb;
}

declare module 'n64' {
    class U64 extends Number {
        constructor(n: Number);
        mul(b: U64): U64;
    }
}
