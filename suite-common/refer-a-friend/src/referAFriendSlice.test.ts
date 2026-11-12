import { asEncryptedHex } from '@suite-common/platform-encryption';

import {
    type ReferAFriendState,
    referAFriendActions,
    referAFriendInitialState,
    referAFriendReducer,
    selectReferralAccountState,
    selectReferralDeviceRecord,
} from './referAFriendSlice';
import { type ReferralAccount } from './referAFriendTypes';
import { type ReferralKey } from './referralKey';

const DEVICE_ID = 'device-1';
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
    it('keeps the key and the link in one device record', () => {
        const state = reduce([
            referAFriendActions.setEncryptedReferralKey({ deviceId: DEVICE_ID, encryptedKey }),
            referAFriendActions.setReferralLink({
                deviceId: DEVICE_ID,
                code: 'K7M2Q9WX',
                shareUrl: 'https://trezor.io/ref/K7M2Q9WX',
            }),
        ]);

        expect(selectReferralDeviceRecord({ referAFriend: state }, DEVICE_ID)).toEqual({
            encryptedKey,
            code: 'K7M2Q9WX',
            shareUrl: 'https://trezor.io/ref/K7M2Q9WX',
        });
    });

    it('removes the device record together with its account data', () => {
        const state = reduce([
            referAFriendActions.setEncryptedReferralKey({ deviceId: DEVICE_ID, encryptedKey }),
            referAFriendActions.accountLoaded({
                deviceId: DEVICE_ID,
                account: activeAccount,
                vouchers: [],
            }),
            referAFriendActions.removeReferralDevice({ deviceId: DEVICE_ID }),
        ]);

        expect(state.devices).toEqual({});
        expect(state.accounts).toEqual({});
    });

    it('tracks the account loading lifecycle', () => {
        const loadingState = reduce([
            referAFriendActions.accountRequested({ deviceId: DEVICE_ID }),
        ]);
        const loadedState = reduce(
            [
                referAFriendActions.accountLoaded({
                    deviceId: DEVICE_ID,
                    account: activeAccount,
                    vouchers: [],
                }),
            ],
            loadingState,
        );

        expect(selectReferralAccountState({ referAFriend: loadingState }, DEVICE_ID).status).toBe(
            'loading',
        );
        expect(selectReferralAccountState({ referAFriend: loadedState }, DEVICE_ID)).toEqual({
            status: 'loaded',
            account: activeAccount,
            vouchers: [],
            error: null,
            pendingAction: null,
        });
    });

    it('clears backend data when the API URL changes, keeping the device records', () => {
        const state = reduce([
            referAFriendActions.setEncryptedReferralKey({ deviceId: DEVICE_ID, encryptedKey }),
            referAFriendActions.programFailed({ type: 'FetchError', message: 'offline' }),
            referAFriendActions.accountKeyMissing({ deviceId: DEVICE_ID }),
            referAFriendActions.setReferAFriendApiBaseUrl({ baseUrl: 'http://localhost:4010/' }),
        ]);

        expect(state.settings.baseUrl).toBe('http://localhost:4010/');
        expect(state.program).toEqual(referAFriendInitialState.program);
        expect(state.accounts).toEqual({});
        expect(state.devices[DEVICE_ID]?.encryptedKey).toBe(encryptedKey);
    });

    it('returns an idle account state for an unknown device', () => {
        expect(
            selectReferralAccountState({ referAFriend: referAFriendInitialState }, undefined)
                .status,
        ).toBe('idle');
    });
});
