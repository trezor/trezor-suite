export const VERSION = '9.0.0-beta.8';

const versionN = VERSION.split('.').map(s => parseInt(s, 10));

export const DEFAULT_DOMAIN = `https://connect.trezor.io/${versionN[0]}/`;
