import type { LocalFirmwares } from '@trezor/connect-common';

let firmwares: LocalFirmwares = { firmwareDir: '', firmwareList: [] };

export const set = (next: LocalFirmwares): void => {
    firmwares = next;
};

export const get = (): LocalFirmwares => firmwares;
