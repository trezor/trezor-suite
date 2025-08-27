import { tradingExchangeActions } from '@suite-common/trading';
import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../../__fixtures__/account';
import { getWalletState } from '../../../../__fixtures__/walletState';
import { selectExchangeSelectedSendAccount } from '../../../../selectors/exchangeSelectors';
import { useSendAccountChangeEffect } from '../useSendAccountChangeEffect';

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

    beforeEach(async () => {
        const preloadState = { wallet: getWalletState({ tradeType: 'exchange' }) };
        store = await initStore(preloadState);
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
            store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('sendAccount', getBtcAccount('btc-account-1'));
    });

    it('should set sendAsset to undefined when no trading account is selected', async () => {
        await renderUseSendAccountChangeEffect();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
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
            store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
        });

        setValue.mockClear();
        act(() => {
            store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-2'));
        });

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith('sendAccount', getBtcAccount('btc-account-2'));
    });
});
