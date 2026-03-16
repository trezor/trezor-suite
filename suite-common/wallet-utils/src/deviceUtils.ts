import { type TrezorDevice, type TrezorDeviceWithState } from '@suite-common/suite-types';
import { asWalletDescriptor } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { isNotNullOrUndefined, isNotUndefined } from '@trezor/utils';

export const parseDeviceStaticSessionId = (deviceStaticSessionId: StaticSessionId) => {
    const [walletDescriptor, deviceId] = deviceStaticSessionId.split('@');

    return {
        walletDescriptor: asWalletDescriptor(walletDescriptor),
        deviceId,
    };
};

// local copy of import { isApprovalFlowSupported } from '@suite-common/device'; > reviewTransactionUtils
export const isApprovalFlowSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmApproval'];

export const isTrezorDeviceWithState = (
    device: TrezorDevice | undefined,
): device is TrezorDeviceWithState =>
    isNotUndefined(device) &&
    isNotNullOrUndefined(device.state) &&
    isNotUndefined(device.state.staticSessionId);
