import { TrezorDevice } from '@suite-common/suite-types';
import { asWalletDescriptor } from '@suite-common/wallet-types';
import { Device, StaticSessionId } from '@trezor/connect';

export const parseDeviceStaticSessionId = (deviceStaticSessionId: StaticSessionId) => {
    const [walletDescriptor, deviceId] = deviceStaticSessionId.split('@');

    return {
        walletDescriptor: asWalletDescriptor(walletDescriptor),
        deviceId,
    };
};

export const shouldDeviceBeRemembered = ({
    device,
    isDeviceAutoEjectEnabled = false,
}: {
    device: TrezorDevice | Device;
    isDeviceAutoEjectEnabled?: boolean;
}) => {
    if (device.mode !== 'normal') return false;

    if (device.type !== 'acquired') return false;

    return !isDeviceAutoEjectEnabled;
};

export const isApprovalFlowSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmApproval'];
