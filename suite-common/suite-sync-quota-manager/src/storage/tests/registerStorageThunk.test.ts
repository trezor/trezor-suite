import { mocked } from 'jest-mock';

import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { ok } from '@trezor/type-utils';

import { quotaManagerDeviceFetched, quotaManagerFetchError } from '../../quotaManagerActions';
import { quotaManagerFetch } from '../../quotaManagerFetch';
import { selectQuotaManagerBaseUrl } from '../../quotaManagerSelectors';
import { registerStorageThunk } from '../registerStorageThunk';

jest.mock('../../quotaManagerFetch');
jest.mock('../../quotaManagerSelectors');
jest.mock('@suite-common/wallet-core');

const mockDispatch = jest.fn();
const mockGetState = jest.fn();

const mockedQuotaManagerUrl = 'https://trezor.io/quota-manager';

describe(registerStorageThunk.name, () => {
    const params = {
        publicKey: 'pubkey',
        size: 123,
        proof: 'proof',
        certificateChain: {
            deviceCert: 'deviceCert',
            caCert: 'caCert',
        },
        deviceModel: 'T3T1',
        sessionId: 'sessionId',
        challenge: 'challenge',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mocked(selectQuotaManagerBaseUrl).mockReturnValue(mockedQuotaManagerUrl);
    });

    it('dispatches quotaManagerDeviceFetched on success', async () => {
        mocked(selectSelectedDevice).mockReturnValue(mockSuiteDevice({ id: 'device-id' }));

        mocked(quotaManagerFetch).mockResolvedValue(
            ok({
                totalStorageSize: 1000,
                unspentStorageSize: 800,
            }),
        );

        const thunk = registerStorageThunk(params);
        const result = await thunk(mockDispatch, mockGetState);

        expect(quotaManagerFetch).toHaveBeenCalledWith({
            baseUrl: mockedQuotaManagerUrl,
            path: '/storage/register',
            method: 'POST',
            body: params,
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            quotaManagerDeviceFetched({
                deviceId: 'device-id',
                totalStorageSize: 1000,
                unspentStorageSize: 800,
            }),
        );
        expect(result.success).toBe(true);

        // hack
        if (result.success) {
            expect(result.payload).toEqual({
                totalStorageSize: 1000,
                unspentStorageSize: 800,
            });
        }
    });

    it('dispatches quotaManagerFetchError on failure', async () => {
        mocked(selectSelectedDevice).mockReturnValue(mockSuiteDevice({ id: 'device-id' }));

        mocked(quotaManagerFetch).mockResolvedValue({
            success: false,
            error: { type: 'FetchError', message: 'Network error' },
        });

        const thunk = registerStorageThunk(params);
        const result = await thunk(mockDispatch, mockGetState);

        expect(mockDispatch).toHaveBeenCalledWith(
            quotaManagerFetchError({ error: 'Network error' }),
        );
        expect(result.success).toBe(false);

        // hack
        if (!result.success) {
            expect(result.error).toEqual({ type: 'FetchError', message: 'Network error' });
        }
    });

    it('does not dispatch quotaManagerDeviceFetched if device is missing', async () => {
        mocked(selectSelectedDevice).mockReturnValue(undefined);

        mocked(quotaManagerFetch).mockResolvedValue(
            ok({
                totalStorageSize: 1000,
                unspentStorageSize: 800,
            }),
        );

        const thunk = registerStorageThunk(params);
        await thunk(mockDispatch, mockGetState);

        expect(mockDispatch).not.toHaveBeenCalledWith(
            expect.objectContaining(quotaManagerDeviceFetched),
        );
    });
});
