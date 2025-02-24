// Metro doesn't support TS and ES modules, so this file must be in plain JS and CommonJS
const path = require('path');

const { RELATIVE_PATH_REGEX, TREZOR_PACKAGES_SCOPES } = require('./constants');

/**
 * @typedef {Object} SecurityCheckParams
 * @property {string} moduleName
 * @property {string} originModulePath
 */

/**
 * @param {SecurityCheckParams} params
 * @returns {{isViolation: boolean, normalizedPath: string}}
 */
const checkSecurityViolation = ({ moduleName, originModulePath }) => {
    // Normalize path to remove some crazy relative paths like `../../scripts/..packages/connect` etc.
    const normalizedPath = path.normalize(moduleName);

    // Check if file is in node_modules
    const isNodeModules = originModulePath.includes('node_modules');
    // prevent standarts imports like `from '@trezor/connect'` or `require('@trezor/connect')` etc.
    const isScopedPackage = TREZOR_PACKAGES_SCOPES.some(scope => normalizedPath.includes(scope));
    // 3rd party package can import Connect from node_modules using relative path like `../../../packages/connect`
    // check tests for more examples
    const isRelativePath = RELATIVE_PATH_REGEX.test(normalizedPath);

    return {
        isViolation: (isScopedPackage || isRelativePath) && isNodeModules,
        normalizedPath,
    };
};

/**
 * @param {SecurityCheckParams} params
 */
const metroSecureResolver = ({ moduleName, originModulePath }) => {
    const { isViolation, normalizedPath } = checkSecurityViolation({
        moduleName,
        originModulePath,
    });

    if (isViolation) {
        throw new Error(
            `SECURITY ALERT: Some 3rd party package is trying to import internal packages or Connect!\n` +
                `Module: ${moduleName}\n` +
                `Normalized: ${normalizedPath}\n` +
                `From file: ${originModulePath}`,
        );
    }
};

module.exports = {
    checkSecurityViolation,
    metroSecureResolver,
};
