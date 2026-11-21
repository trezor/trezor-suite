import { asEncryptedHex } from '@suite-common/platform-encryption';
import { asWalletDescriptor } from '@trezor/device-utils';

import {
    selectReferralAccountStateByWalletDescriptor,
    selectReferralWalletRecordByWalletDescriptor,
} from './referAFriendSelectors';
import {
    type ReferAFriendState,
    referAFriendActions,
    referAFriendInitialState,
    referAFriendReducer,
} from './referAFriendSlice';
import { type ReferralAccount } from './referAFriendTypes';
import { type ReferralKey } from './referralKey';

const WALLET_DESCRIPTOR = asWalletDescriptor('standard');
const encryptedKey = asEncryptedHex<ReferralKey>('encrypted');

const activeAccount: ReferralAccount = {
    status: 'active',
    joinedAt: '2026-09-02T10:00:00Z',
    code: 'K7M2Q9WX',
    shareUrl: 'https://trezor.io/ref/K7M2Q9WX',
    redemptionCount: 12,
    redemptionLimit: 50,
    redemptionLimitResetsAt: '2027-01-01',
};

const reduce = (
    actions: Parameters<typeof referAFriendReducer>[1][],
    state: ReferAFriendState = referAFriendInitialState,
) => actions.reduce(referAFriendReducer, state);

describe('referAFriendSlice', () => {
    it('keeps the key and the link in one wallet record', () => {
        const state = reduce([
            referAFriendActions.setEncryptedReferralKey({
                walletDescriptor: WALLET_DESCRIPTOR,
                encryptedKey,
            }),
            referAFriendActions.setReferralLink({
                walletDescriptor: WALLET_DESCRIPTOR,
                code: 'K7M2Q9WX',
                shareUrl: 'https://trezor.io/ref/K7M2Q9WX',
            }),
        ]);

        expect(
            selectReferralWalletRecordByWalletDescriptor(
                { referAFriend: state },
                WALLET_DESCRIPTOR,
            ),
        ).toEqual({
            encryptedKey,
            code: 'K7M2Q9WX',
            shareUrl: 'https://trezor.io/ref/K7M2Q9WX',
        });
    });

    it('removes the wallet record together with its account data', () => {
        const state = reduce([
            referAFriendActions.setEncryptedReferralKey({
                walletDescriptor: WALLET_DESCRIPTOR,
                encryptedKey,
            }),
            referAFriendActions.accountLoaded({
                walletDescriptor: WALLET_DESCRIPTOR,
                account: activeAccount,
                vouchers: [],
            }),
            referAFriendActions.removeReferralWallet({ walletDescriptor: WALLET_DESCRIPTOR }),
        ]);

        expect(state.wallets).toEqual({});
        expect(state.accounts).toEqual({});
    });

    it('tracks the account loading lifecycle', () => {
        const loadingState = reduce([
            referAFriendActions.accountRequested({ walletDescriptor: WALLET_DESCRIPTOR }),
        ]);
        const loadedState = reduce(
            [
                referAFriendActions.accountLoaded({
                    walletDescriptor: WALLET_DESCRIPTOR,
                    account: activeAccount,
                    vouchers: [],
                }),
            ],
            loadingState,
        );

        expect(
            selectReferralAccountStateByWalletDescriptor(
                { referAFriend: loadingState },
                WALLET_DESCRIPTOR,
            ).status,
        ).toBe('loading');
        expect(
            selectReferralAccountStateByWalletDescriptor(
                { referAFriend: loadedState },
                WALLET_DESCRIPTOR,
            ),
        ).toEqual({
            status: 'loaded',
            account: activeAccount,
            vouchers: [],
            error: null,
            pendingAction: null,
        });
    });

    it('clears backend data when the API URL changes, keeping the wallet records', () => {
        const state = reduce([
            referAFriendActions.setEncryptedReferralKey({
                walletDescriptor: WALLET_DESCRIPTOR,
                encryptedKey,
            }),
            referAFriendActions.programFailed({ message: 'offline' }),
            referAFriendActions.accountKeyMissing({ walletDescriptor: WALLET_DESCRIPTOR }),
            referAFriendActions.setReferAFriendApiBaseUrl({ baseUrl: 'http://localhost:4010/' }),
        ]);

        expect(state.settings.baseUrl).toBe('http://localhost:4010/');
        expect(state.program).toEqual(referAFriendInitialState.program);
        expect(state.accounts).toEqual({});
        expect(state.wallets[WALLET_DESCRIPTOR]?.encryptedKey).toBe(encryptedKey);
    });

    it('returns an idle account state for an unknown wallet', () => {
        expect(
            selectReferralAccountStateByWalletDescriptor(
                { referAFriend: referAFriendInitialState },
                null,
            ).status,
        ).toBe('idle');
    });
});
