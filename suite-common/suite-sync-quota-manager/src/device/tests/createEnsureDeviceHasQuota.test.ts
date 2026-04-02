import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';
import { err, ok } from '@trezor/type-utils';

import { createEnsureDeviceHasQuota } from '../createEnsureDeviceHasQuota';
import { createEnsureDeviceHasQuotaDepsMock } from '../mocks/createEnsureDeviceHasQuotaDepsMock';

const device = mockSuiteDevice(
    { id: 'device-id' },
    { internal_model: DeviceModelInternal.T2T1 },
) as TrezorDeviceWithState;

describe(createEnsureDeviceHasQuota.name, () => {
    it('dispatches device fetched when storage already exists', async () => {
        const deps = createEnsureDeviceHasQuotaDepsMock({
            checkStorageByPublicKeyResponses: [
                ok({ status: 'Allocated', totalSpace: 5000, unspentSpace: 1200 }),
            ],
            registerDeviceResponses: [],
        });

        const result = await createEnsureDeviceHasQuota(deps)({
            delegatedKey: DELEGATED_IDENTITY_KEY,
            device,
        });

        expect(result).toEqual(ok());
        expect(deps.checkStorageByPublicKeyFetch).toHaveBeenCalledWith({
            publicKey:
                '0428a3cefc19b41ff56795e371aab72d6d85a3ca2200bd46c54e611a36222295a88b44d6f23ce94025b6010f9eb0f9168ad35d8396dc865fa0a16f2f5471816a45',
        });
        expect(deps.dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: '@suite/quota-manager/deviceFetched',
                payload: {
                    deviceId: 'device-id',
                    totalStorageSize: 5000,
                    unspentStorageSize: 1200,
                },
            }),
        );
        expect(deps.registerDevice).not.toHaveBeenCalled();
    });

    it('returns QuotaManagerCommunicationFailed for non-404 failures', async () => {
        const deps = createEnsureDeviceHasQuotaDepsMock({
            checkStorageByPublicKeyResponses: [
                err({ type: 'HttpError', code: 500, message: 'Internal error' }),
            ],
            registerDeviceResponses: [],
        });

        const result = await createEnsureDeviceHasQuota(deps)({
            delegatedKey: DELEGATED_IDENTITY_KEY,
            device,
        });

        expect(result).toEqual(
            err({
                type: 'QuotaManagerCommunicationFailed',
                caused: { type: 'HttpError', code: 500, message: 'Internal error' },
            }),
        );
        expect(deps.registerDevice).not.toHaveBeenCalled();
    });

    it('requests registration when server reports NoQuota status', async () => {
        const deps = createEnsureDeviceHasQuotaDepsMock({
            checkStorageByPublicKeyResponses: [ok({ status: 'NoQuota' })],
            registerDeviceResponses: [ok()],
        });

        const result = await createEnsureDeviceHasQuota(deps)({
            delegatedKey: DELEGATED_IDENTITY_KEY,
            device,
        });

        expect(result).toEqual(ok());
        expect(deps.registerDevice).toHaveBeenCalledWith({
            delegatedKey: DELEGATED_IDENTITY_KEY,
            device,
        });
    });

    it('returns QuotaManagerCommunicationFailed when device is unknown (HTTP 404)', async () => {
        const deps = createEnsureDeviceHasQuotaDepsMock({
            checkStorageByPublicKeyResponses: [
                err({ type: 'HttpError', code: 404, message: 'Not found' }),
            ],
            registerDeviceResponses: [],
        });

        const result = await createEnsureDeviceHasQuota(deps)({
            delegatedKey: DELEGATED_IDENTITY_KEY,
            device,
        });

        expect(result).toEqual(
            err({
                type: 'QuotaManagerCommunicationFailed',
                caused: { type: 'HttpError', code: 404, message: 'Not found' },
            }),
        );
        expect(deps.registerDevice).not.toHaveBeenCalled();
    });
});
