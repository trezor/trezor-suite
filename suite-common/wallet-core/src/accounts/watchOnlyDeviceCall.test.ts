import { createTestCompositionRoot } from '@suite-common/test-utils';
import { WATCH_ONLY_ACCOUNT_TYPE, asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getWatchOnlyAccountPath } from '@suite-common/wallet-utils';
import { type CallMethodPayload } from '@trezor/connect';

import { type AccountsRootState } from './accountsReducer';
import {
    notifyWatchOnlyDeviceCallThunk,
    selectWatchOnlyAccountForDeviceCall,
} from './watchOnlyDeviceCall';

const ethSymbol = asNetworkSymbol('eth');
const ownedPath = "m/44'/60'/0'/0/0";
const watchOnlyPath = getWatchOnlyAccountPath("m/44'/60'/0'/0/i", 0);
const watchOnlyAccount = mockWalletAccount({
    symbol: ethSymbol,
    accountType: WATCH_ONLY_ACCOUNT_TYPE,
    path: watchOnlyPath,
    descriptor: asAccountDescriptor('0xWatched'),
});
const state = {
    wallet: {
        accounts: [mockWalletAccount({ symbol: ethSymbol, path: ownedPath }), watchOnlyAccount],
    },
};

const signTransaction = (path: string) =>
    ({
        method: 'ethereumSignTransaction',
        path,
        device: { path: 'device-1', state: { staticSessionId: 'wallet@device:0' } },
        transaction: { to: '0xRecipient', value: '0x1', chainId: 1 },
    }) as unknown as CallMethodPayload;

describe(selectWatchOnlyAccountForDeviceCall.name, () => {
    it('finds the watch-only account a call is for', () => {
        expect(selectWatchOnlyAccountForDeviceCall(state, signTransaction(watchOnlyPath))).toBe(
            watchOnlyAccount,
        );
    });

    it('finds the watch-only account a call gives the path to as numbers', () => {
        const call = {
            method: 'ethereumSignTransaction',
            path: [0x8000002c, 0x8000003c, 0x80000000, 0, 2 ** 31 - 1],
        } as unknown as CallMethodPayload;

        expect(selectWatchOnlyAccountForDeviceCall(state, call)).toBe(watchOnlyAccount);
    });

    it('lets an owned account reach the device', () => {
        expect(
            selectWatchOnlyAccountForDeviceCall(state, signTransaction(ownedPath)),
        ).toBeUndefined();
    });

    it('finds a watch-only account in a bundle', () => {
        const bundle = {
            method: 'getAddress',
            bundle: [{ path: ownedPath }, { path: watchOnlyPath }],
        } as unknown as CallMethodPayload;

        expect(selectWatchOnlyAccountForDeviceCall(state, bundle)).toBe(watchOnlyAccount);
    });
});

describe('notifyWatchOnlyDeviceCallThunk', () => {
    it('offers the call data without saying which device it was for', async () => {
        const { store } = createTestCompositionRoot<void, AccountsRootState>({
            preloadedState: { wallet: { accounts: [] } },
        }).services;

        await store.dispatch(
            notifyWatchOnlyDeviceCallThunk({ params: signTransaction(watchOnlyPath) }),
        );

        const toast = store
            .getActions()
            .map(action => (action as { payload?: { type?: string } }).payload)
            .find(payload => payload?.type === 'watch-only-device-call') as
            { method: string; payload: string } | undefined;
        expect(toast?.method).toBe('ethereumSignTransaction');
        expect(JSON.parse(toast?.payload ?? '{}')).toEqual({
            method: 'ethereumSignTransaction',
            path: watchOnlyPath,
            transaction: { to: '0xRecipient', value: '0x1', chainId: 1 },
        });
    });
});
