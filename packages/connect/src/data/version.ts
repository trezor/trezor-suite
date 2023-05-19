export const VERSION = '9.0.11';

const versionN = VERSION.split('.').map(s => parseInt(s, 10));

export const DEFAULT_DOMAIN = `https://connect.trezor.io/${versionN[0]}/`;
