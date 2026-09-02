const REGISTRY_URL = 'https://registry.npmjs.org';

// Abbreviated metadata, we only care about the package existing, not about its (potentially huge) packument.
const ABBREVIATED_METADATA_ACCEPT_HEADER = 'application/vnd.npm.install-v1+json';

/**
 * A package name is "reserved" once it exists on the registry. Until then npm refuses to configure
 * a trusted publisher (OIDC) for it, which is how all @trezor/* packages are published from CI.
 *
 * @param {string} packageName Full package name, including the scope, e.g. `@trezor/connect`.
 * @returns {Promise<boolean>}
 */
export const isPackageOnNpmRegistry = async packageName => {
    const response = await fetch(`${REGISTRY_URL}/${packageName}`, {
        headers: { accept: ABBREVIATED_METADATA_ACCEPT_HEADER },
    });

    if (response.status === 404) {
        return false;
    }

    if (!response.ok) {
        throw new Error(`npm registry returned ${response.status} for ${packageName}`);
    }

    return true;
};
