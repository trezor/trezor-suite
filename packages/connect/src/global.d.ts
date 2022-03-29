// Globals
declare namespace NodeJS {
    export interface Global {
        __TREZOR_CONNECT_SRC?: string;
    }
}

interface Window {
    __TREZOR_CONNECT_SRC?: string;
}
