import { type DeviceRootState, deviceInitialState } from '@suite-common/device';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asWalletDescriptor } from '@trezor/device-utils';

import {
    selectDoesReferralExistOnlyForOtherWallets,
    selectReferralAccountStateByWalletDescriptor,
    selectReferralAnnualRewardLimit,
    selectReferralWalletRecordByWalletDescriptor,
} from './referAFriendSelectors';
import {
    type ReferAFriendRootState,
    type ReferralAccountState,
    type ReferralWalletRecord,
    referAFriendInitialState,
} from './referAFriendSlice';
import { type ReferralProgram } from './referAFriendTypes';
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
    const program: ReferralProgram = {
        fiatCurrency: 'USD',
        rewardAmount: 20,
        friendDiscountPercentage: 10,
        minimumOrderAmount: 49,
        redemptionLimit: 50,
        termsUrl: 'https://trezor.io/refer-a-friend/terms',
    };

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
