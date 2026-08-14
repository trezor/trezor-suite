import { asGetter } from '@suite-common/dependency-injection';
import {
    type RequestDeviceAccess,
    type TrezorConnectDep,
    type TrezorDevice,
} from '@suite-common/suite-types';

import { createRerunFwAuthenticityChecks } from './createRerunFwAuthenticityChecks';

// The service is generic in the callback's payload, which a mock implementation cannot be, so the
// mock is declared as both to stay callable by the service and assertable in the test.
type MockedRequestDeviceAccess = jest.Mock & RequestDeviceAccess;

const mockRequestDeviceAccess = (implementation: (deviceCallback: () => any) => Promise<unknown>) =>
    jest.fn(implementation) as unknown as MockedRequestDeviceAccess;

const grantDeviceAccess = mockRequestDeviceAccess(async deviceCallback => ({
    success: true,
    payload: await deviceCallback(),
}));

type GetFeatures = TrezorConnectDep['trezorConnect']['getFeatures'];

// The service ignores the result, so the mock returns the response that needs no device features.
const featuresResponse: Awaited<ReturnType<GetFeatures>> = {
    success: false,
    error: { message: 'Device is offline.', code: 'Device_Disconnected' },
};
const getFeatures = jest.fn(() => Promise.resolve(featuresResponse));

const device = { path: 'devicePath' } as TrezorDevice;

const rerunChecks = (
    selectedDevice: TrezorDevice | undefined,
    requestDeviceAccess = grantDeviceAccess,
) =>
    createRerunFwAuthenticityChecks({
        getSelectedDevice: asGetter(() => selectedDevice),
        requestDeviceAccess,
        trezorConnect: { getFeatures },
    })();

describe('createRerunFwAuthenticityChecks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('asks for the selected device and calls Connect with its path', async () => {
        rerunChecks(device);

        expect(grantDeviceAccess).toHaveBeenCalledTimes(1);
        await Promise.resolve();
        expect(getFeatures).toHaveBeenCalledWith({ device: { path: 'devicePath' } });
    });

    it('gives up rather than queueing, because it runs on a timer', () => {
        rerunChecks(device);

        expect(grantDeviceAccess).toHaveBeenCalledWith(expect.any(Function), {
            priority: 'skipIfBusy',
        });
    });

    it('does not touch the device when the access is not granted', async () => {
        const denyDeviceAccess = mockRequestDeviceAccess(() =>
            Promise.resolve({ success: false, error: 'Device is busy.', wasSkipped: true }),
        );

        rerunChecks(device, denyDeviceAccess);

        await Promise.resolve();
        expect(getFeatures).not.toHaveBeenCalled();
    });

    it('does nothing when no device is selected', () => {
        rerunChecks(undefined);

        expect(grantDeviceAccess).not.toHaveBeenCalled();
    });
});
