/**
 * @deprecated `@trezor/connect-plugin-ethereum` is deprecated as of `@trezor/connect@10`.
 * EIP-712 hash construction is now handled internally by `@trezor/connect`.
 * Pass the EIP-712 `data` object directly to `TrezorConnect.ethereumSignTypedData`
 * — `domain_separator_hash` and `message_hash` are computed automatically when
 * the device requires them (T1B1 firmware).
 *
 * See https://github.com/trezor/trezor-suite/pull/27091 for migration details.
 */
const DEPRECATION_MESSAGE =
    '@trezor/connect-plugin-ethereum is deprecated. ' +
    'TrezorConnect.ethereumSignTypedData now computes EIP-712 hashes internally; ' +
    'pass `data` directly. See https://github.com/trezor/trezor-suite/pull/27091.';

// Branded return type so legacy callers get a TypeScript error at compile time
// (not just at runtime). The single property name reads as the actionable
// migration hint when destructuring fails — e.g. typical legacy usage
// `const { domain_separator_hash } = transformTypedData(data, true)` triggers:
// "Property 'domain_separator_hash' does not exist on type
// '__TREZOR_CONNECT_PLUGIN_ETHEREUM_DEPRECATED__SeePullRequest27091'".
type __TREZOR_CONNECT_PLUGIN_ETHEREUM_DEPRECATED__SeePullRequest27091 = {
    readonly __deprecated: 'See https://github.com/trezor/trezor-suite/pull/27091';
};

/**
 * @deprecated See https://github.com/trezor/trezor-suite/pull/27091.
 * `TrezorConnect.ethereumSignTypedData` now computes EIP-712 hashes internally.
 * Pass `data` directly; remove your manual `transformTypedData` call.
 */
export const transformTypedData = (
    _data?: unknown,
    _metamask_v4_compat?: unknown,
): __TREZOR_CONNECT_PLUGIN_ETHEREUM_DEPRECATED__SeePullRequest27091 => {
    throw new Error(DEPRECATION_MESSAGE);
};

// eslint-disable-next-line import/no-default-export
export default transformTypedData;
