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

declare module 'golomb';

declare module 'n64';
