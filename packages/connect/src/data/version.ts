export const VERSION = '9.2.5-beta.2';

const versionN = VERSION.split('.').map(s => parseInt(s, 10));

const isBeta = VERSION.includes('beta');

export const DEFAULT_DOMAIN = isBeta
    ? `https://connect.trezor.io/${VERSION}/`
    : `https://connect.trezor.io/${versionN[0]}/`;
