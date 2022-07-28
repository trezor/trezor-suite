// eslint-disable-next-line max-classes-per-file
declare module 'tiny-worker' {
    namespace Worker {}
    class Worker {
        constructor(type: string | (() => any));
        onerror: ((error: any) => any) | undefined;
        onmessage: ((message: any) => any) | undefined;
        addEventListener(event: string, fn: () => any): void;
        postMessage(message: any): void;
        terminate(): void;
        setRange(min: number, max: number): boolean;
    }
    export = Worker;
}

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
