// Globals
declare namespace NodeJS {
    export interface Global {
        __TREZOR_CONNECT_SRC?: string;
    }
}

interface Window {
    __TREZOR_CONNECT_SRC?: string;
}

type TestFixtures<TestedMethod extends (...args: any) => any> = {
    description: string;
    input: Parameters<TestedMethod>;
    output: ReturnType<TestedMethod>;
}[];
