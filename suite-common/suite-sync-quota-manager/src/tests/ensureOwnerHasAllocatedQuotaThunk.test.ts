import { combineReducers } from '@reduxjs/toolkit';

import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import { DelegatedIdentityKey, asSuiteSyncOwnerId } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { asProofOfDelegatedIdentity } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { prepareChallengeSession } from '../challenge/prepareChallengeSession';
import { DEFAULT_OWNER_SIZE_QUOTA } from '../constants';
import { ensureOwnerHasAllocatedQuotaThunk } from '../ensureOwnerHasAllocatedQuotaThunk';
import {
    SuiteSyncQuotaManagerState,
    prepareSuiteSyncQuotaManagerReducer,
    quotaManagerInitialState,
} from '../quotaManagerReducer';
import { checkStorageByOwnerId } from '../storage/checkStorage';
import { transferStorageThunk } from '../storage/transferStorageThunk';

jest.mock('../challenge/prepareChallengeSession', () => ({
    prepareChallengeSession: jest.fn(),
}));

jest.mock('../storage/checkStorage', () => ({
    checkStorageByOwnerId: jest.fn(),
}));

jest.mock('../storage/transferStorageThunk', () => ({
    transferStorageThunk: jest.fn(),
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
const ownerId = 'owner-id';

const prepareChallengeSessionMock = prepareChallengeSession as jest.MockedFunction<
    typeof prepareChallengeSession
>;
const checkStorageByOwnerIdMock = checkStorageByOwnerId as jest.MockedFunction<
    typeof checkStorageByOwnerId
>;
const getProofOfDelegatedIdentityMock = getProofOfDelegatedIdentity as jest.MockedFunction<
    typeof getProofOfDelegatedIdentity
>;
const getPublicIdentityKeyFromDelegatedKeyMock =
    getPublicIdentityKeyFromDelegatedKey as jest.MockedFunction<
        typeof getPublicIdentityKeyFromDelegatedKey
    >;
const transferStorageThunkMock = transferStorageThunk as jest.MockedFunction<
    typeof transferStorageThunk
>;

describe(ensureOwnerHasAllocatedQuotaThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();

        getPublicIdentityKeyFromDelegatedKeyMock.mockReturnValue('public-key');
        transferStorageThunkMock.mockReturnValue(jest.fn());
    });

    it('returns early when quota manager is disabled', async () => {
        const store = createStore({ enabled: false });

        await store.dispatch(
            ensureOwnerHasAllocatedQuotaThunk({
                ownerId: asSuiteSyncOwnerId(ownerId),
                delegatedKey,
            }),
        );

        expect(checkStorageByOwnerIdMock).not.toHaveBeenCalled();
        expect(getPublicIdentityKeyFromDelegatedKeyMock).not.toHaveBeenCalled();
        expect(store.getActions()).toEqual([]);
    });

    it('dispatches owner fetched when storage already exists', async () => {
        const store = createStore({ enabled: true });

        checkStorageByOwnerIdMock.mockResolvedValue(ok({ totalSpace: 2048 }));

        await store.dispatch(
            ensureOwnerHasAllocatedQuotaThunk({
                ownerId: asSuiteSyncOwnerId(ownerId),
                delegatedKey,
            }),
        );

        expect(checkStorageByOwnerIdMock).toHaveBeenCalledWith({
            baseUrl: 'https://quota-manager.test',
            ownerId,
        });
        expect(store.getActions()).toContainEqual({
            type: '@suite/quota-manager/ownerFetched',
            payload: {
                ownerIdHash: '6bf59adace75d8046b55264ca904a615145c2c52da304dd016c09610ee0010a4',
                totalSpace: 2048,
            },
        });
        expect(prepareChallengeSessionMock).not.toHaveBeenCalled();
        expect(transferStorageThunkMock).not.toHaveBeenCalled();
    });

    it('dispatches quota manager error for non-404 failures', async () => {
        const store = createStore({ enabled: true });

        checkStorageByOwnerIdMock.mockResolvedValue(err({ code: 500, message: 'Internal error' }));

        await store.dispatch(
            ensureOwnerHasAllocatedQuotaThunk({
                ownerId: asSuiteSyncOwnerId(ownerId),
                delegatedKey,
            }),
        );

        expect(store.getActions()).toContainEqual({
            type: '@suite/quota-manager/fetchError',
            payload: { error: 'Internal error' },
        });
        expect(prepareChallengeSessionMock).not.toHaveBeenCalled();
    });

    it('requests storage transfer when owner storage is missing', async () => {
        const store = createStore({ enabled: true });

        checkStorageByOwnerIdMock.mockResolvedValue(err({ code: 404, message: 'Not Found' }));
        prepareChallengeSessionMock.mockResolvedValue(
            ok({ sessionId: 'session-123', challenge: 'aa55' }),
        );
        getProofOfDelegatedIdentityMock.mockReturnValue(
            ok(asProofOfDelegatedIdentity('proof-hex')),
        );

        const transferThunkInner = jest.fn();
        transferStorageThunkMock.mockReturnValue(transferThunkInner);

        await store.dispatch(
            ensureOwnerHasAllocatedQuotaThunk({
                ownerId: asSuiteSyncOwnerId(ownerId),
                delegatedKey,
            }),
        );

        expect(prepareChallengeSessionMock).toHaveBeenCalledWith({
            baseUrl: 'https://quota-manager.test',
        });
        expect(getProofOfDelegatedIdentityMock).toHaveBeenCalledWith({
            delegatedKey,
            header: 'EvoluAddSpaceToOwnerV1',
            buffer: expect.any(Buffer),
        });
        expect(transferStorageThunkMock).toHaveBeenCalledWith({
            ownerId,
            publicKey: 'public-key',
            proof: 'proof-hex',
            size: DEFAULT_OWNER_SIZE_QUOTA,
            challenge: 'aa55',
            sessionId: 'session-123',
        });
        expect(transferThunkInner).toHaveBeenCalled();
        expect(store.getActions()).toEqual([]);
    });

    it('does not dispatch transfer when proof generation fails', async () => {
        const store = createStore({ enabled: true });

        checkStorageByOwnerIdMock.mockResolvedValue(err({ code: 404, message: 'Not Found' }));
        prepareChallengeSessionMock.mockResolvedValue(
            ok({ sessionId: 'session-123', challenge: 'aa55' }),
        );
        getProofOfDelegatedIdentityMock.mockReturnValue(err({ type: 'ProofFailed' } as any));

        await store.dispatch(
            ensureOwnerHasAllocatedQuotaThunk({
                ownerId: asSuiteSyncOwnerId(ownerId),
                delegatedKey,
            }),
        );

        expect(transferStorageThunkMock).not.toHaveBeenCalled();
    });
});
