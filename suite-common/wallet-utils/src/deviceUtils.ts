import { type TrezorDevice } from '@suite-common/suite-types';
import { asWalletDescriptor } from '@suite-common/wallet';
import { isStaticSessionId, parseStaticSessionId } from '@trezor/device-utils';

/**
 * @deprecated Prefer `parseStaticSessionId` from `@trezor/device-utils`. This wrapper
 * remains for back-compat with existing call sites and uses the canonical parser
 * underneath. Returns the first BIP44 testnet receive address as a branded
 * `WalletDescriptor`, plus the raw device id (without the trailing `:instance`).
 */
export const parseDeviceStaticSessionId = (deviceStaticSessionId: string) => {
    if (!isStaticSessionId(deviceStaticSessionId)) {
        throw new Error(`Invalid staticSessionId: ${deviceStaticSessionId}`);
    }

    const { firstTestnetAddress, deviceId } = parseStaticSessionId(deviceStaticSessionId);

    return {
        walletDescriptor: asWalletDescriptor(firstTestnetAddress),
        deviceId,
    };
};

// local copy of import { isApprovalFlowSupported } from '@suite-common/device'; > reviewTransactionUtils
export const isApprovalFlowSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmApproval'];

// local copy of import { isEvmClearSigningSupported } from '@suite-common/device'; > reviewTransactionUtils
export const isEvmClearSigningSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmClearSigning'];
