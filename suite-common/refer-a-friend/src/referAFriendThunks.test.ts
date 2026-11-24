import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { createMockDeps } from '@trezor/dependency-injection';
import { asWalletDescriptor } from '@trezor/device-utils';
import { createMockDispatch } from '@trezor/redux-utils/mocks';
import { type Result, err, ok } from '@trezor/type-utils';

import { type ReferralApiFetchParams } from './api/createReferralApiFetch';
import {
    type ReferAFriendState,
    referAFriendActions,
    referAFriendInitialState,
} from './referAFriendSlice';
import {
    type FetchReferralAccountThunkState,
    type JoinReferralProgramThunkDeps,
    fetchReferralAccountThunk,
    fetchReferralProgramThunk,
    joinReferralProgramThunk,
    leaveReferralProgramThunk,
} from './referAFriendThunks';
import {
    type ReferralAccount,
    type ReferralError,
    type ReferralProgram,
    type ReferralVoucher,
} from './referAFriendTypes';
import { getReferralKeyFromCipheredValue } from './referralKey';

const DEVICE_ID = 'device-1';
const WALLET_DESCRIPTOR = asWalletDescriptor('standard');
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
    status,
    joinedAt: null,
    code: null,
    shareUrl: null,
    redemptionCount: null,
    redemptionLimit: null,
    redemptionLimitResetsAt: null,
});

const availableVoucher: ReferralVoucher = {
    code: 'TREF-8K2M-X9P4',
    status: 'available',
    amount: 20,
    fiatCurrency: 'USD',
    orderPaidAt: '2026-09-15T15:30:00Z',
    availableAt: '2026-10-15T00:00:00Z',
    expiresAt: '2027-10-15T00:00:00Z',
    usedAt: null,
};

const vouchers = [availableVoucher];

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

type ApiResponses = Partial<Record<string, Result<unknown, ReferralError>>>;

const getRequestName = (params: ReferralApiFetchParams) => `${params.method} ${params.endpoint}`;

const joinedWalletRecords: ReferAFriendState['wallets'] = {
    [WALLET_DESCRIPTOR]: {
        encryptedKey: null,
        code: activeAccount.code,
        shareUrl: activeAccount.shareUrl,
    },
};

type SetupParams = {
    walletRecords?: ReferAFriendState['wallets'];
    storedReferralKey?: typeof referralKey | null;
    devices?: TrezorDevice[];
    apiResponses?: ApiResponses;
};

const standardWallet = createWallet({});

const setup = ({
    walletRecords = joinedWalletRecords,
    storedReferralKey = referralKey,
    devices = [standardWallet, hiddenWallet],
    apiResponses = {},
}: SetupParams = {}) => {
    // The account loading needs the records, the actions only the devices.
    const state: FetchReferralAccountThunkState = {
        referAFriend: { ...referAFriendInitialState, wallets: walletRecords },
        device: { ...deviceInitialState, devices },
    };
    const getState = () => state;
    const extra = createMockDeps<JoinReferralProgramThunkDeps>({
        services: {
            referAFriend: {
                referralApiFetch: params =>
                    Promise.resolve(
                        apiResponses[getRequestName(params)] ??
                            err({ message: 'Unexpected request' }),
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

    it('fails on an unsupported fiat currency', async () => {
        const { actions, dispatch, getState, extra } = setup({
            apiResponses: { 'GET v1/program': ok({ ...program, fiatCurrency: 'XYZ' }) },
        });

        await fetchReferralProgramThunk()(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.programFailed({ message: 'Unsupported fiat currency' }),
        );
    });

    it('accepts terms on a trezor.io subdomain', async () => {
        const subdomainProgram = { ...program, termsUrl: 'https://shop.trezor.io/terms' };
        const { actions, dispatch, getState, extra } = setup({
            apiResponses: { 'GET v1/program': ok(subdomainProgram) },
        });

        await fetchReferralProgramThunk()(dispatch, getState, extra);

        expect(actions).toContainEqual(referAFriendActions.programLoaded(subdomainProgram));
    });

    it.each([
        'https://trezor.io.example.com/terms',
        'https://eviltrezor.io/terms',
        'https://trezor.io@example.com/terms',
        'https://example.com\\@trezor.io/terms',
        'javascript://trezor.io/%0aalert(1)',
        'http://trezor.io/terms',
        'not a url',
    ])('fails on terms outside https://trezor.io: %s', async termsUrl => {
        const { actions, dispatch, getState, extra } = setup({
            apiResponses: { 'GET v1/program': ok({ ...program, termsUrl }) },
        });

        await fetchReferralProgramThunk()(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.programFailed({ message: 'Invalid terms URL' }),
        );
    });

    it.each([
        ['rewardAmount', undefined],
        ['rewardAmount', '20'],
        ['rewardAmount', Number.NaN],
        ['redemptionLimit', null],
        ['redemptionLimit', Infinity],
    ])('fails on invalid %s: %p', async (field, value) => {
        const { actions, dispatch, getState, extra } = setup({
            apiResponses: { 'GET v1/program': ok({ ...program, [field]: value }) },
        });

        await fetchReferralProgramThunk()(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.programFailed({ message: 'Invalid reward fields' }),
        );
    });
});

describe('fetchReferralAccountThunk', () => {
    it('does nothing without a stored link', async () => {
        const { actions, dispatch, getState, extra, referAFriend } = setup({ walletRecords: {} });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).not.toContainEqual(
            referAFriendActions.accountRequested({ walletDescriptor: WALLET_DESCRIPTOR }),
        );
        expect(referAFriend.loadReferralKey).not.toHaveBeenCalled();
    });

    it('does nothing without a standard wallet', async () => {
        const { dispatch, getState, extra, referAFriend } = setup({ devices: [hiddenWallet] });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(referAFriend.loadReferralKey).not.toHaveBeenCalled();
    });

    it('marks the key as missing without calling the backend or the device', async () => {
        const { actions, dispatch, getState, extra, referAFriend } = setup({
            storedReferralKey: null,
        });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.accountKeyMissing({ walletDescriptor: WALLET_DESCRIPTOR }),
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
                walletDescriptor: WALLET_DESCRIPTOR,
                code: activeAccount.code,
                shareUrl: activeAccount.shareUrl,
            }),
        );
        expect(actions).toContainEqual(
            referAFriendActions.accountLoaded({
                walletDescriptor: WALLET_DESCRIPTOR,
                account: activeAccount,
                vouchers,
            }),
        );
    });

    it('parses voucher amounts sent as decimal strings', async () => {
        const { actions, dispatch, getState, extra } = setup({
            apiResponses: {
                'GET v1/account': ok(activeAccount),
                'GET v1/vouchers': ok({ vouchers: [{ ...availableVoucher, amount: '20.50' }] }),
            },
        });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.accountLoaded({
                walletDescriptor: WALLET_DESCRIPTOR,
                account: activeAccount,
                vouchers: [{ ...availableVoucher, amount: 20.5 }],
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
                walletDescriptor: WALLET_DESCRIPTOR,
                code: null,
                shareUrl: null,
            }),
        );
        expect(actions).not.toContainEqual(
            referAFriendActions.removeReferralWallet({ walletDescriptor: WALLET_DESCRIPTOR }),
        );
        expect(referAFriend.removeReferralKeyFromSession).not.toHaveBeenCalled();
    });

    it('forgets the link and the key when the account left on another device', async () => {
        const { actions, dispatch, getState, extra, referAFriend } = setup({
            apiResponses: { 'GET v1/account': ok(accountWithoutCode('left')) },
        });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.removeReferralWallet({ walletDescriptor: WALLET_DESCRIPTOR }),
        );
        expect(referAFriend.removeReferralKeyFromSession).toHaveBeenCalledWith(WALLET_DESCRIPTOR);
    });

    it('stores the error when the account cannot be loaded', async () => {
        const error: ReferralError = {
            message: 'Request failed with status 429',
            httpStatus: 429,
            code: 'rateLimited',
        };
        const { actions, dispatch, getState, extra } = setup({
            apiResponses: { 'GET v1/account': err(error) },
        });

        await fetchReferralAccountThunk({ deviceId: DEVICE_ID })(dispatch, getState, extra);

        expect(actions).toContainEqual(
            referAFriendActions.accountFailed({ walletDescriptor: WALLET_DESCRIPTOR, error }),
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
            walletDescriptor: WALLET_DESCRIPTOR,
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
        const { dispatch, getState, extra, referAFriend } = setup({
            storedReferralKey: null,
            devices: [hiddenWallet],
        });

        const result = await joinReferralProgramThunk({ deviceId: DEVICE_ID })(
            dispatch,
            getState,
            extra,
        );

        expect(result.payload).toMatchObject({ success: false });
        expect(referAFriend.retrieveReferralKeyFromDevice).not.toHaveBeenCalled();
    });
});

describe('leaveReferralProgramThunk', () => {
    it('leaves the program and forgets the wallet record and the key', async () => {
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
            referAFriendActions.removeReferralWallet({ walletDescriptor: WALLET_DESCRIPTOR }),
        );
        expect(referAFriend.removeReferralKeyFromSession).toHaveBeenCalledWith(WALLET_DESCRIPTOR);
    });
});
