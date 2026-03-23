import { mocked } from 'jest-mock';

import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import { asSuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import { type WalletDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { prepareChallengeSession } from '../challenge/prepareChallengeSession';
import { DEFAULT_ACCOUNT_SIZE_QUOTA } from '../constants';
import { ensureOwnerHasAllocatedQuotaThunk } from '../ensureOwnerHasAllocatedQuotaThunk';
import { type SuiteSyncQuotaManagerState, quotaManagerInitialState } from '../quotaManagerReducer';
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

const createGetState = (statePatch?: Partial<SuiteSyncQuotaManagerState>) => () => ({
    suiteSyncQuotaManager: {
        ...quotaManagerInitialState,
        baseUrl: 'https://quota-manager.test',
        ...statePatch,
    },
});

const ownerId = asSuiteSyncOwnerId('owner-id');
const walletDescriptor: WalletDescriptor = asWalletDescriptor('descriptor');
const deviceId = 'device-123';
const deviceStaticSessionId = `${walletDescriptor}@${deviceId}` as StaticSessionId;

const prepareChallengeSessionMock = mocked(prepareChallengeSession);
const checkStorageByOwnerIdMock = mocked(checkStorageByOwnerId);
const transferStorageThunkMock = mocked(transferStorageThunk);

describe(ensureOwnerHasAllocatedQuotaThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        transferStorageThunkMock.mockReturnValue(jest.fn());
    });

    it('dispatches owner fetched when storage already exists', async () => {
        const getState = createGetState();
        const dispatch = jest.fn();

        checkStorageByOwnerIdMock.mockResolvedValue(ok({ totalSpace: 2048 }));

        await ensureOwnerHasAllocatedQuotaThunk({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceStaticSessionId,
            isWriteMode: false,
        })(dispatch, getState);

        expect(checkStorageByOwnerIdMock).toHaveBeenCalledWith({
            baseUrl: 'https://quota-manager.test',
            ownerId,
        });
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: '@suite/quota-manager/ownerFetched',
                payload: {
                    walletDescriptor,
                    totalSpace: 2048,
                },
            }),
        );
        expect(prepareChallengeSessionMock).not.toHaveBeenCalled();
        expect(transferStorageThunkMock).not.toHaveBeenCalled();
    });

    it("not attempt to allocate quota when none is remaining and return 'NoQuotaLeftToAllocate' error", async () => {
        const getState = createGetState({
            registeredDevices: [
                {
                    deviceId,
                    totalStorageSize: 5000,
                    unspentStorageSize: 0,
                    dismissedNoQuotaLeftWarning: false,
                },
            ],
        });
        const dispatch = jest.fn();

        checkStorageByOwnerIdMock.mockResolvedValue(
            err({ type: 'HttpError', code: 404, message: 'Not Found' }),
        );
        const result = await ensureOwnerHasAllocatedQuotaThunk({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceStaticSessionId,
            isWriteMode: true,
        })(dispatch, getState);

        expect(result).toEqual(err({ type: 'NoQuotaLeftToAllocate' }));
        expect(prepareChallengeSessionMock).not.toHaveBeenCalled();
    });

    it('dispatches quota manager error for non-404 failures', async () => {
        const getState = createGetState();
        const dispatch = jest.fn();

        checkStorageByOwnerIdMock.mockResolvedValue(
            err({ type: 'HttpError', code: 500, message: 'Internal error' }),
        );

        await ensureOwnerHasAllocatedQuotaThunk({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceStaticSessionId,
            isWriteMode: false,
        })(dispatch, getState);

        expect(prepareChallengeSessionMock).not.toHaveBeenCalled();
    });

    it('requests storage transfer when owner storage is missing', async () => {
        const getState = createGetState();
        const dispatch: ReturnType<typeof jest.fn> = jest.fn((action: unknown) => {
            if (typeof action === 'function')
                return (action as (...args: any[]) => any)(dispatch, getState);

            return action;
        });

        checkStorageByOwnerIdMock.mockResolvedValue(
            err({ type: 'HttpError', code: 404, message: 'Not Found' }),
        );
        prepareChallengeSessionMock.mockResolvedValue(
            ok({ sessionId: 'session-123', challenge: 'aa55' }),
        );

        const transferThunkInner = jest.fn();
        transferStorageThunkMock.mockReturnValue(transferThunkInner);

        await ensureOwnerHasAllocatedQuotaThunk({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceStaticSessionId,
            isWriteMode: true,
        })(dispatch, getState);

        expect(prepareChallengeSessionMock).toHaveBeenCalledWith({
            baseUrl: 'https://quota-manager.test',
        });
        expect(transferStorageThunkMock).toHaveBeenCalledWith({
            params: {
                ownerId,
                publicKey:
                    '0428a3cefc19b41ff56795e371aab72d6d85a3ca2200bd46c54e611a36222295a88b44d6f23ce94025b6010f9eb0f9168ad35d8396dc865fa0a16f2f5471816a45',
                proof: '2944ed0b226eb961750433b65639366871cf05a10dfd598a0651a39e18e5ada578f76fda26478316ac93115b1538bbad11044b83a59259efa8c2f9feaba1675b',
                size: DEFAULT_ACCOUNT_SIZE_QUOTA,
                challenge: 'aa55',
                sessionId: 'session-123',
            },
            walletDescriptor,
            deviceId,
        });
        expect(transferThunkInner).toHaveBeenCalled();
    });

    it('allocates remaining quota when unspent storage is less than default increment', async () => {
        const remainingQuota = 500;
        const getState = createGetState({
            registeredDevices: [
                {
                    deviceId,
                    totalStorageSize: 5000,
                    unspentStorageSize: remainingQuota,
                    dismissedNoQuotaLeftWarning: false,
                },
            ],
        });
        const dispatch: ReturnType<typeof jest.fn> = jest.fn((action: unknown) => {
            if (typeof action === 'function')
                return (action as (...args: any[]) => any)(dispatch, getState);

            return action;
        });

        checkStorageByOwnerIdMock.mockResolvedValue(
            err({ type: 'HttpError', code: 404, message: 'Not Found' }),
        );
        prepareChallengeSessionMock.mockResolvedValue(
            ok({ sessionId: 'session-456', challenge: 'bb66' }),
        );

        const transferThunkInner = jest.fn();
        transferStorageThunkMock.mockReturnValue(transferThunkInner);

        await ensureOwnerHasAllocatedQuotaThunk({
            ownerId,
            delegatedKey: DELEGATED_IDENTITY_KEY,
            deviceStaticSessionId,
            isWriteMode: true,
        })(dispatch, getState);

        expect(transferStorageThunkMock).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    size: remainingQuota,
                }),
            }),
        );
        expect(transferThunkInner).toHaveBeenCalled();
    });
});
