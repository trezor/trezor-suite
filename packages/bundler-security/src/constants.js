const TREZOR_PACKAGES_SCOPES = ['@trezor', '@suite-common', '@suite-native'];
const PACKAGES_PATHS = ['/packages/', '/suite-common/', '/suite-native/'];

const RELATIVE_PATH_REGEX = new RegExp(
    `(?:\\.\\./){2,}(?:${PACKAGES_PATHS.map(p => p.slice(1, -1)).join('|')})`,
);

module.exports = {
    TREZOR_PACKAGES_SCOPES,
    RELATIVE_PATH_REGEX,
};
