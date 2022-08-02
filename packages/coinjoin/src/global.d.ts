declare module 'golomb' {
    class Golomb {
        constructor();
        n: number;
        p: number;
        m: number;
        data: Buffer;
        match(key: Buffer, script: Buffer): boolean;
    }
    export = Golomb;
}

declare module 'n64';
