import { type TrezorDevice } from '@suite-common/suite-types';
import { asWalletDescriptor } from '@suite-common/wallet-types';
import { isStaticSessionId, parseStaticSessionId } from '@trezor/device-utils';

/**
 * @deprecated Prefer `parseStaticSessionId` from `@trezor/device-utils`. This wrapper
 * remains for back-compat with existing call sites and uses the canonical parser
 * underneath. Returns the first BIP44 testnet receive address as a branded
 * `WalletDescriptor`, plus the raw device id (without the trailing `:instance`).
 *
 * The parameter is intentionally typed `string` rather than `StaticSessionId`: many
 * call sites (mostly tests) pass values derived from `parseAccountKey`, which itself
 * returns plain `string`, and a few legacy fixtures still hand in malformed literals.
 * The runtime guard below preserves pre-#27415 best-effort behavior for those.
 */
export const parseDeviceStaticSessionId = (deviceStaticSessionId: string) => {
    if (isStaticSessionId(deviceStaticSessionId)) {
        const { firstTestnetAddress, deviceId } = parseStaticSessionId(deviceStaticSessionId);

        return {
            walletDescriptor: asWalletDescriptor(firstTestnetAddress),
            deviceId,
        };
    }

    // TODO: drop this fallback in trezor/trezor-suite#27494 (Stage 2), which
    // migrates the bogus `'foo-bar' as AccountKey` literals scattered across
    // the test suite to `createAccountKey()` and re-enables the no-hyphen
    // invariant on the descriptor.
    const [walletDescriptor = '', deviceId = ''] = deviceStaticSessionId.split('@');

    return {
        walletDescriptor: asWalletDescriptor(walletDescriptor),
        deviceId,
    };
};

// local copy of import { isApprovalFlowSupported } from '@suite-common/device'; > reviewTransactionUtils
export const isApprovalFlowSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmApproval'];
