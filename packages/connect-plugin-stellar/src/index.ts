type __TREZOR_CONNECT_PLUGIN_STELLAR_DEPRECATED__ = {
    readonly __deprecated: '@trezor/connect-plugin-stellar is deprecated. See README.md for migration info';
};

/**
 * @deprecated `@trezor/connect-plugin-stellar` is deprecated as of `@trezor/connect@10`.
 */
export const transformTransaction = (
    _path?: unknown,
    _transaction?: unknown,
): __TREZOR_CONNECT_PLUGIN_STELLAR_DEPRECATED__ => {
    throw new Error(
        '@trezor/connect-plugin-stellar is deprecated. See README.md for migration info.',
    );
};

// eslint-disable-next-line import/no-default-export
export default transformTransaction;
