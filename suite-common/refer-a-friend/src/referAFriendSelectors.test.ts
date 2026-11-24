import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asWalletDescriptor } from '@trezor/device-utils';

import { type ReferralProgram, type ReferralVoucher } from './referAFriendSchemas';
import {
    selectDoesReferralExistOnlyForOtherWallets,
    selectReferralAccountStateByWalletDescriptor,
    selectReferralAnnualRewardLimit,
    selectReferralLink,
    selectReferralProgramData,
    selectReferralRewards,
    selectReferralWalletRecordByWalletDescriptor,
} from './referAFriendSelectors';
import {
    type ReferAFriendRootState,
    type ReferralAccountState,
    type ReferralProgramState,
    type ReferralWalletRecord,
    referAFriendInitialState,
} from './referAFriendSlice';
import { type ReferralKey } from './referralKey';

const WALLET_DESCRIPTOR = asWalletDescriptor('standard');
const UNKNOWN_WALLET_DESCRIPTOR = asWalletDescriptor('unknown');

const walletRecord: ReferralWalletRecord = {
    encryptedKey: asEncryptedHex<ReferralKey>('encrypted'),
    code: 'K7M2Q9WX',
    shareUrl: 'https://trezor.io/ref/K7M2Q9WX',
};

const accountState: ReferralAccountState = {
    status: 'loaded',
    account: {
        status: 'active',
        joinedAt: '2026-09-02T10:00:00Z',
        code: 'K7M2Q9WX',
        shareUrl: 'https://trezor.io/ref/K7M2Q9WX',
        redemptionCount: 12,
        redemptionLimit: 50,
        redemptionLimitResetsAt: '2027-01-01',
    },
    vouchers: [],
    error: null,
    pendingAction: null,
};

const state: ReferAFriendRootState = {
    referAFriend: {
        ...referAFriendInitialState,
        wallets: { [WALLET_DESCRIPTOR]: walletRecord },
        accounts: { [WALLET_DESCRIPTOR]: accountState },
    },
};

const program: ReferralProgram = {
    fiatCurrency: 'USD',
    rewardAmount: 20,
    friendDiscountPercentage: 10,
    minimumOrderAmount: 49,
    redemptionLimit: 50,
    termsUrl: 'https://trezor.io/refer-a-friend/terms',
};

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

const standardWalletDevice = mockSuiteDevice({
    instance: 1,
    state: { staticSessionId: `${WALLET_DESCRIPTOR}@device-id:1` },
});

type CreateStateWithDeviceParams = {
    wallets: ReferAFriendRootState['referAFriend']['wallets'];
    accounts?: ReferAFriendRootState['referAFriend']['accounts'];
    program?: ReferralProgramState;
    isStandardWalletAvailable?: boolean;
};

const createStateWithDevice = ({
    wallets,
    accounts,
    program: programState,
    isStandardWalletAvailable = true,
}: CreateStateWithDeviceParams): ReferAFriendRootState & DeviceRootState => ({
    referAFriend: {
        ...referAFriendInitialState,
        wallets,
        accounts: accounts ?? {},
        program: programState ?? referAFriendInitialState.program,
    },
    device: {
        ...deviceInitialState,
        devices: isStandardWalletAvailable ? [standardWalletDevice] : [],
        selectedDevice: standardWalletDevice,
    },
});

describe(selectReferralProgramData.name, () => {
    it('returns null when the program data is not loaded', () => {
        expect(selectReferralProgramData(state)).toBeNull();
    });

    it('returns null when the program failed', () => {
        const stateWithError = {
            ...state,
            referAFriend: {
                ...state.referAFriend,
                program: {
                    ...referAFriendInitialState.program,
                    status: 'error' as const,
                    data: null,
                },
            },
        };

        expect(selectReferralProgramData(stateWithError)).toBeNull();
    });

    it('returns formatted program data', () => {
        const stateWithProgram = {
            ...state,
            referAFriend: {
                ...state.referAFriend,
                program: {
                    ...referAFriendInitialState.program,
                    status: 'loaded' as const,
                    data: program,
                },
            },
        };

        expect(selectReferralProgramData(stateWithProgram)).toEqual({
            rewardAmount: '$20',
            friendDiscountPercentage: 10,
            minimumOrderAmount: '$49',
            periodReferralLimit: 50,
            periodRewardAmountLimit: '$1,000',
        });
    });
});

describe(selectReferralWalletRecordByWalletDescriptor.name, () => {
    it('returns the wallet record of the given wallet', () => {
        expect(selectReferralWalletRecordByWalletDescriptor(state, WALLET_DESCRIPTOR)).toEqual(
            walletRecord,
        );
    });

    it('returns null for an unknown or missing wallet', () => {
        expect(
            selectReferralWalletRecordByWalletDescriptor(state, UNKNOWN_WALLET_DESCRIPTOR),
        ).toBeNull();
        expect(selectReferralWalletRecordByWalletDescriptor(state, null)).toBeNull();
    });
});

describe(selectReferralLink.name, () => {
    it('returns the share URL of the standard wallet record', () => {
        const stateWithDevice = createStateWithDevice({
            wallets: { [WALLET_DESCRIPTOR]: walletRecord },
        });

        expect(selectReferralLink(stateWithDevice)).toBe('https://trezor.io/ref/K7M2Q9WX');
    });

    it('returns null when the standard wallet record has no share URL', () => {
        const stateWithDevice = createStateWithDevice({
            wallets: { [WALLET_DESCRIPTOR]: { ...walletRecord, shareUrl: null } },
        });

        expect(selectReferralLink(stateWithDevice)).toBeNull();
    });

    it('returns undefined when there is no wallet record for the standard wallet', () => {
        const stateWithDevice = createStateWithDevice({ wallets: {} });

        expect(selectReferralLink(stateWithDevice)).toBeUndefined();
    });
});

describe(selectReferralAccountStateByWalletDescriptor.name, () => {
    it('returns the account state of the given wallet', () => {
        expect(selectReferralAccountStateByWalletDescriptor(state, WALLET_DESCRIPTOR)).toEqual(
            accountState,
        );
    });

    it('returns an idle account state for an unknown or missing wallet', () => {
        expect(
            selectReferralAccountStateByWalletDescriptor(state, UNKNOWN_WALLET_DESCRIPTOR).status,
        ).toBe('idle');
        expect(selectReferralAccountStateByWalletDescriptor(state, null).status).toBe('idle');
    });
});

describe(selectReferralAnnualRewardLimit.name, () => {
    const createState = (data: ReferralProgram | null): ReferAFriendRootState => ({
        referAFriend: {
            ...referAFriendInitialState,
            program: { status: data === null ? 'idle' : 'loaded', data, error: null },
        },
    });

    it('multiplies the reward amount by the redemption limit', () => {
        expect(selectReferralAnnualRewardLimit(createState(program))).toBe(1000);
    });

    it('returns null when the program is not loaded', () => {
        expect(selectReferralAnnualRewardLimit(createState(null))).toBeNull();
    });

    it('returns null when the result would be NaN', () => {
        expect(
            selectReferralAnnualRewardLimit(createState({ ...program, rewardAmount: Number.NaN })),
        ).toBeNull();
    });
});

describe(selectDoesReferralExistOnlyForOtherWallets.name, () => {
    const OTHER_WALLET_DESCRIPTOR = asWalletDescriptor('other');

    const standardWallet = mockSuiteDevice({
        instance: 1,
        state: { staticSessionId: `${WALLET_DESCRIPTOR}@device-id:1` },
    });

    const joinedRecord: ReferralWalletRecord = walletRecord;
    const notJoinedRecord: ReferralWalletRecord = { ...walletRecord, code: null, shareUrl: null };

    type CreateStateParams = {
        wallets: ReferAFriendRootState['referAFriend']['wallets'];
        isStandardWalletAvailable?: boolean;
    };

    const createState = ({
        wallets,
        isStandardWalletAvailable = true,
    }: CreateStateParams): ReferAFriendRootState & DeviceRootState => ({
        referAFriend: { ...referAFriendInitialState, wallets },
        device: {
            ...deviceInitialState,
            devices: isStandardWalletAvailable ? [standardWallet] : [],
            selectedDevice: standardWallet,
        },
    });

    it('returns true when another wallet descriptor has joined', () => {
        const stateWithDevice = createState({
            wallets: { [OTHER_WALLET_DESCRIPTOR]: joinedRecord },
        });

        expect(selectDoesReferralExistOnlyForOtherWallets(stateWithDevice)).toBe(true);
    });

    it('returns true when another wallet descriptor has joined and the standard one has a record but has not joined', () => {
        const stateWithDevice = createState({
            wallets: {
                [WALLET_DESCRIPTOR]: notJoinedRecord,
                [OTHER_WALLET_DESCRIPTOR]: joinedRecord,
            },
        });

        expect(selectDoesReferralExistOnlyForOtherWallets(stateWithDevice)).toBe(true);
    });

    it('returns false when both the standard and another wallet descriptor have joined', () => {
        const stateWithDevice = createState({
            wallets: {
                [WALLET_DESCRIPTOR]: joinedRecord,
                [OTHER_WALLET_DESCRIPTOR]: joinedRecord,
            },
        });

        expect(selectDoesReferralExistOnlyForOtherWallets(stateWithDevice)).toBe(false);
    });

    it('returns false when only the standard wallet descriptor has joined', () => {
        const stateWithDevice = createState({ wallets: { [WALLET_DESCRIPTOR]: joinedRecord } });

        expect(selectDoesReferralExistOnlyForOtherWallets(stateWithDevice)).toBe(false);
    });

    it('returns false when another wallet descriptor has a record but has not joined', () => {
        const stateWithDevice = createState({
            wallets: { [OTHER_WALLET_DESCRIPTOR]: notJoinedRecord },
        });

        expect(selectDoesReferralExistOnlyForOtherWallets(stateWithDevice)).toBe(false);
    });

    it('returns false when there are no records', () => {
        const stateWithDevice = createState({ wallets: {} });

        expect(selectDoesReferralExistOnlyForOtherWallets(stateWithDevice)).toBe(false);
    });

    it('returns false when the standard wallet descriptor is not available', () => {
        const stateWithDevice = createState({
            wallets: { [OTHER_WALLET_DESCRIPTOR]: joinedRecord },
            isStandardWalletAvailable: false,
        });

        expect(selectDoesReferralExistOnlyForOtherWallets(stateWithDevice)).toBe(false);
    });
});

describe(selectReferralRewards.name, () => {
    it('returns rewards computed from program and account state', () => {
        const vouchers: ReferralVoucher[] = [
            { ...availableVoucher, status: 'available', amount: 20 },
            { ...availableVoucher, status: 'used', usedAt: '2026-10-20T00:00:00Z', amount: 30 },
            { ...availableVoucher, status: 'expired', amount: 10 },
            { ...availableVoucher, status: 'pending', code: null, expiresAt: null, amount: 15 },
            { ...availableVoucher, status: 'canceled', amount: 5 },
        ];

        const accountStateWithVouchers: ReferralAccountState = {
            ...accountState,
            status: 'loaded',
            vouchers,
        };

        const stateWithDevice = createStateWithDevice({
            wallets: { [WALLET_DESCRIPTOR]: walletRecord },
            accounts: { [WALLET_DESCRIPTOR]: accountStateWithVouchers },
            program: { ...referAFriendInitialState.program, status: 'loaded', data: program },
        });

        expect(selectReferralRewards(stateWithDevice)).toEqual({
            status: 'loaded',
            fiatCurrency: 'USD',
            totalEarnedAmount: 60,
            availableVoucherCount: 1,
            vouchers,
        });
    });

    it('returns an idle account state when there is no account for the standard wallet', () => {
        const stateWithDevice = createStateWithDevice({
            wallets: { [WALLET_DESCRIPTOR]: walletRecord },
            accounts: {},
            program: { ...referAFriendInitialState.program, status: 'loaded', data: program },
        });

        expect(selectReferralRewards(stateWithDevice)).toEqual({
            status: 'idle',
            fiatCurrency: 'USD',
            totalEarnedAmount: 0,
            availableVoucherCount: 0,
            vouchers: [],
        });
    });

    it('returns null when the program has no data', () => {
        const stateWithDevice = createStateWithDevice({
            wallets: { [WALLET_DESCRIPTOR]: walletRecord },
            accounts: { [WALLET_DESCRIPTOR]: accountState },
        });

        expect(selectReferralRewards(stateWithDevice)).toBeNull();
    });
});
