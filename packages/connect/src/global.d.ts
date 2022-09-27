// Globals
declare namespace globalThis {
    // eslint-disable-next-line no-var, vars-on-top
    var __TREZOR_CONNECT_SRC: string | undefined;
}

interface Window {
    __TREZOR_CONNECT_SRC?: string;
}
