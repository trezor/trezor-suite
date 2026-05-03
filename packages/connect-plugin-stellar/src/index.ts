/**
 * @deprecated `@trezor/connect-plugin-stellar` is deprecated as of `@trezor/connect@10`.
 * The Stellar transaction transformation is now handled internally by `@trezor/connect`.
 * Pass the `@stellar/stellar-sdk` `Transaction` directly to
 * `TrezorConnect.stellarSignTransaction` (alongside `path` and `networkPassphrase`)
 * and connect will normalize it.
 *
 * See README for migration details.
 */

const DEPRECATION_MESSAGE =
    '@trezor/connect-plugin-stellar is deprecated. ' +
    'TrezorConnect.stellarSignTransaction now normalizes a stellar-sdk Transaction internally; ' +
    'pass it directly with `path` and `networkPassphrase`. See the package README for migration.';

// Branded return type so legacy callers get a TypeScript error at compile time
// (not just at runtime). The single property name reads as the actionable
// migration hint when destructuring fails — e.g. typical legacy usage
// `const { transaction } = transformTransaction(path, tx)` triggers:
// "Property 'transaction' does not exist on type
// '__TREZOR_CONNECT_PLUGIN_STELLAR_DEPRECATED__SeeReadme'".
type __TREZOR_CONNECT_PLUGIN_STELLAR_DEPRECATED__SeeReadme = {
    readonly __deprecated: 'See @trezor/connect-plugin-stellar README';
};

/**
 * @deprecated See README. `TrezorConnect.stellarSignTransaction` now normalizes
 * a stellar-sdk `Transaction` internally. Remove your manual `transformTransaction` call.
 */
export const transformTransaction = (
    _path?: unknown,
    _transaction?: unknown,
): __TREZOR_CONNECT_PLUGIN_STELLAR_DEPRECATED__SeeReadme => {
    throw new Error(DEPRECATION_MESSAGE);
};

export default transformTransaction;
