import { tradingExchangeActions } from '@suite-common/trading';
import { AccountKey } from '@suite-common/wallet-types';
import { act } from '@suite-native/test-utils';
import { type TestStore, initStore, renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { useSendAccountChangeEffect } from '../useSendAccountChangeEffect';

const btc1AccountKey = 'btc-account-1' as AccountKey; // Todo: create properly via `createAccountKey()`
const btc2AccountKey = 'btc-account-2' as AccountKey; // Todo: create properly via `createAccountKey()`

describe('useSendAccountChangeEffect', () => {
    let store: TestStore;
    let setValue: jest.Mock;

    const renderUseSendAccountChangeEffect = () =>
        renderHookWithStoreProviderAsync(
            () => {
                useSendAccountChangeEffect(setValue, selectExchangeSelectedSendAccount);
            },
            { store },
        );

    beforeEach(() => {
        const preloadState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        store = initStore(preloadState).store;
        setValue = jest.fn();
    });

    it('should set sendAccount and sendAsset to undefined initially', async () => {
        await renderUseSendAccountChangeEffect();

        expect(setValue).toHaveBeenCalledTimes(2);
        expect(setValue).toHaveBeenCalledWith('sendAccount', undefined);
        expect(setValue).toHaveBeenCalledWith('sendAsset', undefined);
    });

    it('should set sendAccount when account is changed in store', async () => {
        await renderUseSendAccountChangeEffect();

        setValue.mockClear();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('sendAccount', getBtcAccount(btc1AccountKey));
    });

    it('should set sendAsset to undefined when no trading account is selected', async () => {
        await renderUseSendAccountChangeEffect();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
        });

        setValue.mockClear();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(undefined));
        });

        expect(setValue).toHaveBeenCalledTimes(2);
        expect(setValue).toHaveBeenCalledWith('sendAccount', undefined);
        expect(setValue).toHaveBeenCalledWith('sendAsset', undefined);
    });

    it('should not change sendAsset when trading account key changed', async () => {
        await renderUseSendAccountChangeEffect();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc1AccountKey));
        });

        setValue.mockClear();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey(btc2AccountKey));
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('sendAccount', getBtcAccount(btc2AccountKey));
    });
});
