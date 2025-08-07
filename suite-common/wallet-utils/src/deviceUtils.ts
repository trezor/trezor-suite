import { TrezorDevice } from '@suite-common/suite-types';
import { WalletDescriptor } from '@suite-common/wallet-types';
import { Device, StaticSessionId } from '@trezor/connect';
import { isNative } from '@trezor/env-utils';

export const parseDeviceStaticSessionId = (deviceStaticSessionId: StaticSessionId) => {
    const [walletDescriptor] = deviceStaticSessionId.split('@');

    return {
        walletDescriptor: walletDescriptor as WalletDescriptor,
    };
};

export const shouldDeviceBeRemembered = ({
    isDeviceAutoEjectEnabled,
    device,
}: {
    isDeviceAutoEjectEnabled: boolean;
    device: TrezorDevice | Device;
}) => {
    if (!isNative()) return true;

    if (device.mode !== 'normal') return false;

    return !isDeviceAutoEjectEnabled;
};

export const isApprovalFlowSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmApproval'];
