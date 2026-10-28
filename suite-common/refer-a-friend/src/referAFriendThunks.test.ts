import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { createMockDeps } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';
import { type Result, err, ok } from '@trezor/type-utils';

import { type ReferralApiFetchParams } from './api/createReferralApiFetch';
import {
    type ReferAFriendState,
    referAFriendActions,
    referAFriendInitialState,
} from './referAFriendSlice';
import {
    type JoinReferralProgramThunkDeps,
    type JoinReferralProgramThunkState,
    deriveReferralKeyThunk,
    fetchReferralAccountThunk,
    fetchReferralProgramThunk,
    joinReferralProgramThunk,
    leaveReferralProgramThunk,
} from './referAFriendThunks';
import {
    type ReferralAccount,
    type ReferralProgram,
    type ReferralRequestError,
    type ReferralVoucher,
} from './referAFriendTypes';
import { getReferralKeyFromCipheredValue } from './referralKey';

const DEVICE_ID = 'device-1';
const referralKey = getReferralKeyFromCipheredValue(
    '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
);

const program: ReferralProgram = {
    fiatCurrency: 'USD',
    rewardAmount: 20,
    friendDiscountPercentage: 10,
    minimumOrderAmount: 49,
    redemptionLimit: 50,
    termsUrl: 'https://trezor.io/refer-a-friend/terms',
};

const activeAccount: ReferralAccount = {
    status: 'active',
    joinedAt: '2026-09-02T10:00:00Z',
    code: 'K7M2Q9WX',
    shareUrl: 'https://trezor.io/ref/K7M2Q9WX',
    redemptionCount: 1,
    redemptionLimit: 50,
    redemptionLimitResetsAt: '2027-01-01',
};

const accountWithoutCode = (status: 'none' | 'left'): ReferralAccount => ({
    ...activeAccount,
    status,
    code: null,
    shareUrl: null,
});

const vouchers: ReferralVoucher[] = [
    {
        voucher: 'TREF-8K2M-X9P4',
        status: 'ready',
        amount: 20,
        fiatCurrency: 'USD',
        orderPaidAt: '2026-09-15T15:30:00Z',
        readyAt: '2026-10-15T00:00:00Z',
        expiresAt: '2027-10-15T00:00:00Z',
        usedAt: null,
    },
];

// A full TrezorDevice is irrelevant here, only the identity of wallet instances matters.
const createWallet = (overrides: Partial<TrezorDevice>) =>
    ({
        id: DEVICE_ID,
        connected: true,
        instance: 1,
        useEmptyPassphrase: true,
        state: { staticSessionId: 'standard@device-1:1' },
        ...overrides,
    }) as unknown as TrezorDevice;

const hiddenWallet = createWallet({
    instance: 2,
    useEmptyPassphrase: false,
    state: { staticSessionId: 'hidden@device-1:2' },
});

type ApiResponses = Partial<Record<string, Result<unknown, ReferralRequestError>>>;

const getRequestName = (params: ReferralApiFetchParams) => `${params.method} ${params.endpoint}`;

const joinedDeviceRecords: ReferAFriendState['devices'] = {
    [DEVICE_ID]: {
        encryptedKey: null,
        code: activeAccount.code,
        shareUrl: activeAccount.shareUrl,
    },
};

type SetupParams = {
    deviceRecords?: ReferAFriendState['devices'];
    storedReferralKey?: typeof referralKey | null;
    devices?: TrezorDevice[];
    apiResponses?: ApiResponses;
};

const standardWallet = createWallet({});

const setup = ({
    deviceRecords = joinedDeviceRecords,
    storedReferralKey = referralKey,
    devices = [standardWallet, hiddenWallet],
    apiResponses = {},
}: SetupParams = {}) => {
    const state: JoinReferralProgramThunkState = {
        referAFriend: { ...referAFriendInitialState, devices: deviceRecords },
        device: { ...deviceInitialState, devices },
    };
    const getState = () => state;
    const extra = createMockDeps<JoinReferralProgramThunkDeps>({
        services: {
            referAFriend: {
                referralApiFetch: params =>
                    Promise.resolve(
                        apiResponses[getRequestName(params)] ??
                            err({ type: 'FetchError', message: 'Unexpected request' }),
                    ),
                retrieveReferralKeyFromDevice: () => Promise.resolve(ok(referralKey)),
                loadReferralKey: () => Promise.resolve(storedReferralKey),
                saveReferralKey: () => Promise.resolve(),
                removeReferralKeyFromSession: () => {},
            },
        },
    });
    const { actions, dispatch } = createMockDispatch({ getState, extra });
    const { referAFriend } = extra.services;
    const getRequests = () =>
        referAFriend.referralApiFetch.mock.calls.map(([params]) => getRequestName(params));

    return { actions, dispatch, getState, extra, referAFriend, getRequests };
};

describe('fetchReferralProgramThunk', () => {
    it('stores the loaded program', async () => {
        const { actions, dispatch, getState, extra } = setup({
            apiResponses: { 'GET v1/program': ok(program) },
        });

        await fetchReferralProgramThunk()(dispatch, getState, extra);

        expect(actions).toContainEqual(referAFriendActions.programLoaded(program));
    });

    it('stores the error', async () => {
        const { actions, dispatch, getState, extra } = setup();

        await fetchReferralProgramThunk()(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.programFailed({
                type: 'FetchError',
                message: 'Unexpected request',
            }),
        );
    });
});

describe('fetchReferralAccountThunk', () => {
    it('does nothing without a stored link', async () => {
        const { actions, dispatch, getState, extra, referAFriend } = setup({ deviceRecords: {} });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).not.toContainEqual(
            referAFriendActions.accountRequested({ deviceId: DEVICE_ID }),
        );
        expect(referAFriend.loadReferralKey).not.toHaveBeenCalled();
    });

    it('marks the key as missing without calling the backend or the device', async () => {
        const { actions, dispatch, getState, extra, referAFriend } = setup({
            storedReferralKey: null,
        });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.accountKeyMissing({ deviceId: DEVICE_ID }),
        );
        expect(referAFriend.referralApiFetch).not.toHaveBeenCalled();
        expect(referAFriend.retrieveReferralKeyFromDevice).not.toHaveBeenCalled();
    });

    it('loads an active account with vouchers and stores its link', async () => {
        const { actions, dispatch, getState, extra } = setup({
            apiResponses: {
                'GET v1/account': ok(activeAccount),
                'GET v1/vouchers': ok({ vouchers }),
            },
        });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.setReferralLink({
                deviceId: DEVICE_ID,
                code: activeAccount.code,
                shareUrl: activeAccount.shareUrl,
            }),
        );
        expect(actions).toContainEqual(
            referAFriendActions.accountLoaded({
                deviceId: DEVICE_ID,
                account: activeAccount,
                vouchers,
            }),
        );
    });

    it('forgets the link but keeps the key when the backend does not know the account', async () => {
        const { actions, dispatch, getState, extra, referAFriend } = setup({
            apiResponses: { 'GET v1/account': ok(accountWithoutCode('none')) },
        });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.setReferralLink({
                deviceId: DEVICE_ID,
                code: null,
                shareUrl: null,
            }),
        );
        expect(actions).not.toContainEqual(
            referAFriendActions.removeReferralDevice({ deviceId: DEVICE_ID }),
        );
        expect(referAFriend.removeReferralKeyFromSession).not.toHaveBeenCalled();
    });

    it('forgets the link and the key when the account left on another device', async () => {
        const { actions, dispatch, getState, extra, referAFriend } = setup({
            apiResponses: { 'GET v1/account': ok(accountWithoutCode('left')) },
        });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.removeReferralDevice({ deviceId: DEVICE_ID }),
        );
        expect(referAFriend.removeReferralKeyFromSession).toHaveBeenCalledWith(DEVICE_ID);
    });

    it('stores the error when the account cannot be loaded', async () => {
        const error: ReferralRequestError = {
            type: 'ApiError',
            code: 'rateLimited',
            httpStatus: 429,
        };
        const { actions, dispatch, getState, extra } = setup({
            apiResponses: { 'GET v1/account': err(error) },
        });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.accountFailed({ deviceId: DEVICE_ID, error }),
        );
    });
});

describe('joinReferralProgramThunk', () => {
    it('derives the key on the standard wallet and creates the account', async () => {
        const { dispatch, getState, extra, referAFriend, getRequests } = setup({
            storedReferralKey: null,
            apiResponses: {
                'GET v1/account': ok(accountWithoutCode('none')),
                'POST v1/account': ok(activeAccount),
                'GET v1/vouchers': ok({ vouchers: [] }),
            },
        });

        const result = await joinReferralProgramThunk({ deviceId: DEVICE_ID })(
            dispatch,
            getState,
            extra,
        );

        expect(result.payload).toEqual(ok(undefined));
        expect(referAFriend.retrieveReferralKeyFromDevice).toHaveBeenCalledWith({
            device: standardWallet,
        });
        expect(referAFriend.saveReferralKey).toHaveBeenCalledWith({
            deviceId: DEVICE_ID,
            referralKey,
        });
        expect(getRequests()).toEqual(['GET v1/account', 'POST v1/account', 'GET v1/vouchers']);
    });

    it('only loads an account that is already active', async () => {
        const { dispatch, getState, extra, getRequests } = setup({
            apiResponses: {
                'GET v1/account': ok(activeAccount),
                'GET v1/vouchers': ok({ vouchers: [] }),
            },
        });

        await joinReferralProgramThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(getRequests()).not.toContain('POST v1/account');
    });

    it('fails without a standard wallet and never derives on a hidden wallet', async () => {
        const { actions, dispatch, getState, extra, referAFriend } = setup({
            storedReferralKey: null,
            devices: [hiddenWallet],
        });

        const result = await joinReferralProgramThunk({ deviceId: DEVICE_ID })(
            dispatch,
            getState,
            extra,
        );

        expect(result.payload).toEqual(err({ type: 'StandardWalletUnavailable' }));
        expect(referAFriend.retrieveReferralKeyFromDevice).not.toHaveBeenCalled();
        expect(actions).toContainEqual(
            referAFriendActions.pendingActionFinished({ deviceId: DEVICE_ID }),
        );
    });
});

describe('deriveReferralKeyThunk', () => {
    it('returns the device error and does not save anything', async () => {
        const { dispatch, getState, extra, referAFriend } = setup({ storedReferralKey: null });
        referAFriend.retrieveReferralKeyFromDevice.mockResolvedValue(
            err({ type: 'DeviceCancelled' }),
        );

        const result = await deriveReferralKeyThunk({ deviceId: DEVICE_ID })(
            dispatch,
            getState,
            extra,
        );

        expect(result.payload).toEqual(err({ type: 'DeviceCancelled' }));
        expect(referAFriend.saveReferralKey).not.toHaveBeenCalled();
        expect(referAFriend.referralApiFetch).not.toHaveBeenCalled();
    });
});

describe('leaveReferralProgramThunk', () => {
    it('leaves the program and forgets the device record and the key', async () => {
        const { actions, dispatch, getState, extra, referAFriend } = setup({
            apiResponses: { 'POST v1/account/leave': ok(accountWithoutCode('left')) },
        });

        const result = await leaveReferralProgramThunk({ deviceId: DEVICE_ID })(
            dispatch,
            getState,
            extra,
        );

        expect(result.payload).toEqual(ok(undefined));
        expect(actions).toContainEqual(
            referAFriendActions.removeReferralDevice({ deviceId: DEVICE_ID }),
        );
        expect(referAFriend.removeReferralKeyFromSession).toHaveBeenCalledWith(DEVICE_ID);
    });

    it('keeps everything when leaving fails', async () => {
        const { actions, dispatch, getState, extra } = setup();

        const result = await leaveReferralProgramThunk({ deviceId: DEVICE_ID })(
            dispatch,
            getState,
            extra,
        );

        expect(result.payload).toEqual(err({ type: 'FetchError', message: 'Unexpected request' }));
        expect(actions).not.toContainEqual(
            referAFriendActions.removeReferralDevice({ deviceId: DEVICE_ID }),
        );
    });
});
