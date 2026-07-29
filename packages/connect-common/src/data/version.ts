export const VERSION = '10.0.0-beta.1';

const versionN = VERSION.split('.').map(s => parseInt(s, 10));

export const DEFAULT_DOMAIN_MAJOR_VER = `https://connect.trezor.io/${versionN[0]}/`;

// Increment with deeplink protocol changes
export const DEEPLINK_VERSION = 1;
