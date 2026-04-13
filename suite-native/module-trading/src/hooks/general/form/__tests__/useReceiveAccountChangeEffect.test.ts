import { tradingExchangeActions } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import { selectExchangeSelectedReceiveAccount } from '@suite-native/trading-state';

import { useReceiveAccountChangeEffect } from '../useReceiveAccountChangeEffect';

describe('useReceiveAccountChangeEffect', () => {
    let store: TestStore;
    let setValue: jest.Mock;

    const renderUseReceiveAccountChangeEffect = () =>
        renderHookWithStoreProvider(
            () => useReceiveAccountChangeEffect(setValue, selectExchangeSelectedReceiveAccount),
            { store },
        );

    beforeEach(() => {
        const preloadState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        store = initStore(preloadState).store;
        setValue = jest.fn();
    });

    it('should set receiveAccount based on store value', () => {
        renderUseReceiveAccountChangeEffect();

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('receiveAccount', undefined);
    });

    it('should set receiveAccount on change', () => {
        renderUseReceiveAccountChangeEffect();

        setValue.mockClear();
        act(() => {
            store.dispatch(
                tradingExchangeActions.setReceiveAccountKey(
                    'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
                ),
            );
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('receiveAccount', {
            account: getBtcAccount(
                'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
            ),
            address: undefined,
        });
    });
});
