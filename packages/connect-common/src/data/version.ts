export const VERSION = '10.0.0-alpha.1';

const versionN = VERSION.split('.').map(s => parseInt(s, 10));

const isBeta = VERSION.includes('beta');

export const DEFAULT_DOMAIN_MAJOR_VER = `https://connect.trezor.io/${versionN[0]}/`;

export const DEFAULT_DOMAIN = isBeta
    ? `https://connect.trezor.io/${VERSION}/`
    : DEFAULT_DOMAIN_MAJOR_VER;

// Increment with deeplink protocol changes
export const DEEPLINK_VERSION = 1;
