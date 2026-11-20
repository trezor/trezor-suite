import { asEncryptedHex } from '@suite-common/platform-encryption';
import { asWalletDescriptor } from '@trezor/device-utils';

import {
    selectReferralAccountStateByWalletDescriptor,
    selectReferralWalletRecordByWalletDescriptor,
} from './referAFriendSelectors';
import {
    type ReferAFriendRootState,
    type ReferralAccountState,
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
