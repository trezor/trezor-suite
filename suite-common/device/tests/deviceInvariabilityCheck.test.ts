import { defaultDevicePersistentData, mockConnectDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
    deviceInvariabilityCheck,
    rawDataToDeviceInvariabilityCheckDTO,
} from '../src/services/deviceInvariabilityCheck';

const deviceId = 'asdf1234';
const defaultFeatures = { internal_model: DeviceModelInternal.T3B1, unit_color: 1 } as const;

describe(deviceInvariabilityCheck.name, () => {
    it('returns success when device matches its previous record', () => {
        const device = mockConnectDevice({ id: deviceId }, defaultFeatures);
        const previousData = {
            ...defaultDevicePersistentData,
            ...defaultFeatures,
            device_id: deviceId,
        };
        const dto = rawDataToDeviceInvariabilityCheckDTO({ device, previousData });
        const result = deviceInvariabilityCheck(dto);
        expect(result).toEqual({ success: true, payload: undefined });
    });

    it('returns success when there is no previous record', () => {
        const device = mockConnectDevice({ id: deviceId }, defaultFeatures);
        const dto = rawDataToDeviceInvariabilityCheckDTO({ device, previousData: undefined });
        const result = deviceInvariabilityCheck(dto);
        expect(result).toEqual({ success: true, payload: undefined });
    });

    it('returns error when device changes its model', () => {
        const device = mockConnectDevice(
            { id: deviceId },
            { ...defaultFeatures, internal_model: DeviceModelInternal.T1B1 },
        );
        const previousData = {
            ...defaultDevicePersistentData,
            ...defaultFeatures,
            device_id: deviceId,
        };
        const dto = rawDataToDeviceInvariabilityCheckDTO({ device, previousData });
        const result = deviceInvariabilityCheck(dto);
        expect(result).toEqual({
            success: false,
            error: {
                previousModel: defaultFeatures.internal_model,
                currentModel: DeviceModelInternal.T1B1,
            },
        });
    });

    it('returns error when device changes its color', () => {
        const device = mockConnectDevice({ id: deviceId }, { ...defaultFeatures, unit_color: 2 });
        const previousData = {
            ...defaultDevicePersistentData,
            ...defaultFeatures,
            device_id: deviceId,
        };
        const dto = rawDataToDeviceInvariabilityCheckDTO({ device, previousData });
        const result = deviceInvariabilityCheck(dto);
        expect(result).toEqual({
            success: false,
            error: {
                previousColor: defaultFeatures.unit_color,
                currentColor: 2,
            },
        });
    });

    it('returns error when device changes both its model and color', () => {
        const device = mockConnectDevice(
            { id: deviceId },
            { internal_model: DeviceModelInternal.T1B1, unit_color: undefined },
        );
        const previousData = {
            ...defaultDevicePersistentData,
            ...defaultFeatures,
            device_id: deviceId,
        };
        const dto = rawDataToDeviceInvariabilityCheckDTO({ device, previousData });
        const result = deviceInvariabilityCheck(dto);
        expect(result).toEqual({
            success: false,
            error: {
                previousModel: defaultFeatures.internal_model,
                currentModel: DeviceModelInternal.T1B1,
                previousColor: defaultFeatures.unit_color,
                currentColor: undefined,
            },
        });
    });
});
