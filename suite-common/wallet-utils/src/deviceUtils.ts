import { TrezorDevice, TrezorDeviceWithState } from '@suite-common/suite-types';
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
    isAutoEjectEnabled = false,
}: {
    device: TrezorDevice | Device;
    isAutoEjectEnabled?: boolean;
}) => {
    if (device.mode !== 'normal') return false;

    if (device.type !== 'acquired') return false;

    return !isAutoEjectEnabled;
};

export const isApprovalFlowSupported = (device: TrezorDevice | undefined) =>
    !device?.unavailableCapabilities?.['evmApproval'];

export const isTrezorDeviceWithState = (
    device: TrezorDevice | undefined,
): device is TrezorDeviceWithState =>
    device !== undefined &&
    device.id !== null &&
    device.state !== undefined &&
    device.state !== null &&
    device.state.staticSessionId !== undefined;
