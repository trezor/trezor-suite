import { type TrezorDevice } from '@suite-common/suite-types';
import { type Device, type Features, asDeviceUniquePath } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

type MockDeviceParams = {
    path: string;
    deviceId?: string | null;
    transportId?: string | null;
    apiType?: Device['descriptor']['apiType'];
    internalModel?: DeviceModelInternal;
    isBootloader?: boolean;
};

export const mockDevice = ({
    path,
    deviceId = 'DEVICE_A',
    transportId = null,
    apiType = 'usb',
    internalModel = DeviceModelInternal.T2T1,
    isBootloader = false,
}: MockDeviceParams): Device =>
    ({
        type: 'acquired',
        id: deviceId,
        path: asDeviceUniquePath(path),
        descriptor: { id: transportId, apiType },
        features: {
            internal_model: internalModel,
            bootloader_mode: isBootloader ? true : null,
        } as Features,
    }) as Device;

type MockTrezorDeviceParams = MockDeviceParams & {
    connected?: boolean;
    instance?: number;
};

export const mockTrezorDevice = ({
    connected = true,
    instance,
    ...deviceParams
}: MockTrezorDeviceParams): TrezorDevice =>
    ({
        ...mockDevice(deviceParams),
        connected,
        instance,
    }) as TrezorDevice;
