declare module 'semver-compare' {
    declare module.exports: (a: string, b:string) => number;
}

declare module 'node-fetch' {
    declare module.exports: typeof fetch;
}

declare module 'json-stable-stringify' {
    declare module.exports: (a: any) => string;
}

declare module 'protobufjs-old-fixed-webpack' {
    declare module.exports: any;
}

declare module 'object.values' {
    declare function shim(): void;
}
