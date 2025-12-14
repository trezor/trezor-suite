import { combineReducers } from '@reduxjs/toolkit';

import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import { DelegatedIdentityKey, TrezorDeviceWithState } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import TrezorConnect, { asProofOfDelegatedIdentity } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { prepareChallengeSession } from '../challenge/prepareChallengeSession';
import { DEFAULT_DEVICE_SIZE_QUOTA } from '../constants';
import { ensureDeviceHasQuotaThunk } from '../ensureDeviceHasQuotaThunk';
import {
    SuiteSyncQuotaManagerState,
    prepareSuiteSyncQuotaManagerReducer,
    quotaManagerInitialState,
} from '../quotaManagerReducer';
import { checkStorageByPublicKey } from '../storage/checkStorage';
import { registerStorageThunk } from '../storage/registerStorageThunk';

jest.mock('../challenge/prepareChallengeSession', () => ({
    prepareChallengeSession: jest.fn(),
}));

jest.mock('../storage/checkStorage', () => ({
    checkStorageByPublicKey: jest.fn(),
}));

jest.mock('../storage/registerStorageThunk', () => ({
    registerStorageThunk: jest.fn(),
}));

jest.mock('@suite-common/delegated-identity-key', () => ({
    getProofOfDelegatedIdentity: jest.fn(),
    getPublicIdentityKeyFromDelegatedKey: jest.fn(),
}));

jest.mock(
    '@trezor/connect-analytics',
    () => ({
        EventType: {
            DeviceSelected: 'DeviceSelected',
        },
    }),
    { virtual: true },
);

const suiteSyncQuotaManagerReducer = prepareSuiteSyncQuotaManagerReducer(extraDependenciesMock);

const createStore = (statePatch?: Partial<SuiteSyncQuotaManagerState>) =>
    configureMockStore({
        reducer: combineReducers({
            suiteSyncQuotaManager: suiteSyncQuotaManagerReducer,
        }),
        preloadedState: {
            suiteSyncQuotaManager: {
                ...quotaManagerInitialState,
                baseUrl: 'https://quota-manager.test',
                ...statePatch,
            },
        },
    });

const delegatedKey = 'deadbeefcafebabe' as unknown as DelegatedIdentityKey;
const device = {
    id: 'device-id',
    features: { internal_model: 'T2T1' },
} as unknown as TrezorDeviceWithState;

const prepareChallengeSessionMock = prepareChallengeSession as jest.MockedFunction<
    typeof prepareChallengeSession
>;
const checkStorageByPublicKeyMock = checkStorageByPublicKey as jest.MockedFunction<
    typeof checkStorageByPublicKey
>;
const getProofOfDelegatedIdentityMock = getProofOfDelegatedIdentity as jest.MockedFunction<
    typeof getProofOfDelegatedIdentity
>;
const getPublicIdentityKeyFromDelegatedKeyMock =
    getPublicIdentityKeyFromDelegatedKey as jest.MockedFunction<
        typeof getPublicIdentityKeyFromDelegatedKey
    >;
const registerStorageThunkMock = registerStorageThunk as jest.MockedFunction<
    typeof registerStorageThunk
>;
let evoluSignRegistrationRequestSpy: jest.SpyInstance;

describe(ensureDeviceHasQuotaThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();

        if (!evoluSignRegistrationRequestSpy) {
            evoluSignRegistrationRequestSpy = jest.spyOn(
                TrezorConnect,
                'evoluSignRegistrationRequest',
            );
        }

        evoluSignRegistrationRequestSpy.mockReset();

        getPublicIdentityKeyFromDelegatedKeyMock.mockReturnValue('public-key');
        registerStorageThunkMock.mockReturnValue(jest.fn());
    });

    afterAll(() => {
        if (evoluSignRegistrationRequestSpy) {
            evoluSignRegistrationRequestSpy.mockRestore();
        }
    });

    it('returns early when quota manager is disabled', async () => {
        const store = createStore({ enabled: false });

        await store.dispatch(ensureDeviceHasQuotaThunk({ delegatedKey, device }));

        expect(checkStorageByPublicKeyMock).not.toHaveBeenCalled();
        expect(getPublicIdentityKeyFromDelegatedKeyMock).not.toHaveBeenCalled();
        expect(store.getActions()).toEqual([]);
    });

    it('dispatches device fetched when storage already exists', async () => {
        const store = createStore({ enabled: true });

        checkStorageByPublicKeyMock.mockResolvedValue(ok({ totalSpace: 5000, unspentSpace: 1200 }));

        await store.dispatch(ensureDeviceHasQuotaThunk({ delegatedKey, device }));

        expect(checkStorageByPublicKeyMock).toHaveBeenCalledWith({
            baseUrl: 'https://quota-manager.test',
            publicKey: 'public-key',
        });
        expect(store.getActions()).toContainEqual({
            type: '@suite/quota-manager/deviceFetched',
            payload: {
                deviceId: 'device-id',
                publicKey: 'public-key',
                totalStorageSize: 5000,
                unspentStorageSize: 1200,
            },
        });
        expect(prepareChallengeSessionMock).not.toHaveBeenCalled();
        expect(registerStorageThunkMock).not.toHaveBeenCalled();
    });

    it('dispatches quota manager error for non-404 failures', async () => {
        const store = createStore({ enabled: true });

        checkStorageByPublicKeyMock.mockResolvedValue(
            err({ code: 500, message: 'Internal error' }),
        );

        await store.dispatch(ensureDeviceHasQuotaThunk({ delegatedKey, device }));

        expect(store.getActions()).toContainEqual({
            type: '@suite/quota-manager/fetchError',
            payload: {
                error: 'Internal error',
            },
        });
        expect(prepareChallengeSessionMock).not.toHaveBeenCalled();
    });

    it('requests registration when storage is missing', async () => {
        const store = createStore({ enabled: true });

        checkStorageByPublicKeyMock.mockResolvedValue(err({ code: 404, message: 'Not Found' }));
        prepareChallengeSessionMock.mockResolvedValue(
            ok({ sessionId: 'session-123', challenge: 'aa55' }),
        );
        getProofOfDelegatedIdentityMock.mockReturnValue(
            ok(asProofOfDelegatedIdentity('proof-hex')),
        );

        const registerThunkInner = jest.fn();
        registerStorageThunkMock.mockReturnValue(registerThunkInner);

        evoluSignRegistrationRequestSpy.mockResolvedValue({
            success: true,
            payload: {
                certificate_chain: ['device-cert', 'ca-cert'],
                signature: 'device-signature',
            },
        });

        await store.dispatch(ensureDeviceHasQuotaThunk({ delegatedKey, device }));

        expect(prepareChallengeSessionMock).toHaveBeenCalledWith({
            baseUrl: 'https://quota-manager.test',
        });
        expect(getProofOfDelegatedIdentityMock).toHaveBeenCalledWith({
            delegatedKey,
            header: 'EvoluSignRegistrationRequest',
            buffer: expect.any(Buffer),
        });
        expect(evoluSignRegistrationRequestSpy).toHaveBeenCalledWith({
            challenge_from_server: 'aa55',
            size_to_acquire: DEFAULT_DEVICE_SIZE_QUOTA,
            proof_of_delegated_identity: 'proof-hex',
        });
        expect(registerStorageThunkMock).toHaveBeenCalledWith({
            size: DEFAULT_DEVICE_SIZE_QUOTA,
            certificateChain: {
                deviceCert: 'device-cert',
                caCert: 'ca-cert',
            },
            challenge: 'aa55',
            proof: 'device-signature',
            sessionId: 'session-123',
            deviceModel: 'T2T1',
            publicKey: 'public-key',
        });
        expect(registerThunkInner).toHaveBeenCalled();
        expect(store.getActions()).toEqual([]);
    });
});
