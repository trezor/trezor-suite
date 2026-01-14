import { asDelegatedIdentityKey, asSuiteSyncOwnerId } from '@suite-common/suite-types';
import { WalletDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';
import { err, ok } from '@trezor/type-utils';

import { prepareChallengeSession } from '../challenge/prepareChallengeSession';
import { DEFAULT_ACCOUNT_SIZE_QUOTA } from '../constants';
import { ensureOwnerHasAllocatedQuotaThunk } from '../ensureOwnerHasAllocatedQuotaThunk';
import { SuiteSyncQuotaManagerState, quotaManagerInitialState } from '../quotaManagerReducer';
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

const delegatedKey = asDelegatedIdentityKey(
    '0c9d40cd155e7ddb93e7b3c7b2acd8d75e7a3ebd543a3504c8f8164fb692772b',
);
const ownerId = asSuiteSyncOwnerId('owner-id');
const walletDescriptor: WalletDescriptor = asWalletDescriptor('descriptor');

const prepareChallengeSessionMock = prepareChallengeSession as jest.MockedFunction<
    typeof prepareChallengeSession
>;
const checkStorageByOwnerIdMock = checkStorageByOwnerId as jest.MockedFunction<
    typeof checkStorageByOwnerId
>;
const transferStorageThunkMock = transferStorageThunk as jest.MockedFunction<
    typeof transferStorageThunk
>;

describe(ensureOwnerHasAllocatedQuotaThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        transferStorageThunkMock.mockReturnValue(jest.fn());
    });

    it('returns early when quota manager is disabled', async () => {
        const getState = createGetState({ enabled: false });
        const dispatch = jest.fn();

        await ensureOwnerHasAllocatedQuotaThunk({ ownerId, delegatedKey, walletDescriptor })(
            dispatch,
            getState,
        );

        expect(checkStorageByOwnerIdMock).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('dispatches owner fetched when storage already exists', async () => {
        const getState = createGetState({ enabled: true });
        const dispatch = jest.fn();

        checkStorageByOwnerIdMock.mockResolvedValue(ok({ totalSpace: 2048 }));

        await ensureOwnerHasAllocatedQuotaThunk({ ownerId, delegatedKey, walletDescriptor })(
            dispatch,
            getState,
        );

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

    it('dispatches quota manager error for non-404 failures', async () => {
        const getState = createGetState({ enabled: true });
        const dispatch = jest.fn();

        checkStorageByOwnerIdMock.mockResolvedValue(err({ code: 500, message: 'Internal error' }));

        await ensureOwnerHasAllocatedQuotaThunk({ ownerId, delegatedKey, walletDescriptor })(
            dispatch,
            getState,
        );

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: '@suite/quota-manager/fetchError',
                payload: { error: 'Internal error' },
            }),
        );
        expect(prepareChallengeSessionMock).not.toHaveBeenCalled();
    });

    it('requests storage transfer when owner storage is missing', async () => {
        const getState = createGetState({ enabled: true });
        const dispatch: ReturnType<typeof jest.fn> = jest.fn((action: unknown) => {
            if (typeof action === 'function')
                return (action as (...args: any[]) => any)(dispatch, getState);

            return action;
        });

        checkStorageByOwnerIdMock.mockResolvedValue(err({ code: 404, message: 'Not Found' }));
        prepareChallengeSessionMock.mockResolvedValue(
            ok({ sessionId: 'session-123', challenge: 'aa55' }),
        );

        const transferThunkInner = jest.fn();
        transferStorageThunkMock.mockReturnValue(transferThunkInner);

        await ensureOwnerHasAllocatedQuotaThunk({ ownerId, delegatedKey, walletDescriptor })(
            dispatch,
            getState,
        );

        expect(prepareChallengeSessionMock).toHaveBeenCalledWith({
            baseUrl: 'https://quota-manager.test',
        });
        expect(transferStorageThunkMock).toHaveBeenCalledWith({
            params: {
                ownerId,
                publicKey:
                    '0428a3cefc19b41ff56795e371aab72d6d85a3ca2200bd46c54e611a36222295a88b44d6f23ce94025b6010f9eb0f9168ad35d8396dc865fa0a16f2f5471816a45',
                proof: '106fb51f7945d6bd6fac019eb7953f43400746884f1e4f69c3cbfe13ec6539604039baa2c6b5ada1e395957908fe9777991910d4bee05c124161597cef814e3e',
                size: DEFAULT_ACCOUNT_SIZE_QUOTA,
                challenge: 'aa55',
                sessionId: 'session-123',
            },
            walletDescriptor,
        });
        expect(transferThunkInner).toHaveBeenCalled();
    });
});
