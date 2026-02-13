import { TrezorDevice, TrezorDeviceWithState } from '@suite-common/suite-types';
import { asWalletDescriptor } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { isNotNullOrUndefined } from '@trezor/utils';

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
    isNotNullOrUndefined(device?.id) && isNotNullOrUndefined(device.state?.staticSessionId);
