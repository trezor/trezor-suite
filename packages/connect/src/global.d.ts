// Globals
declare namespace globalThis {
    // eslint-disable-next-line no-var, vars-on-top
    var __TREZOR_CONNECT_SRC: string | undefined;
}

interface Window {
    __TREZOR_CONNECT_SRC?: string;
}

type TestFixtures<TestedMethod extends (...args: any) => any> = {
    description: string;
    input: Parameters<TestedMethod>;
    output: ReturnType<TestedMethod>;
}[];
