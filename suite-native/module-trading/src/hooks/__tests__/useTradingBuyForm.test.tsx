import type { BuyTrade } from 'invity-api';

import { tradingBuyActions } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { PROTO } from '@trezor/connect';

import quotes from '../../__fixtures__/quotes.json';
import { btcAsset, usdcAsset } from '../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { setBuySelectedReceiveAccount } from '../../tradingSlice';
import { TradeableAsset } from '../../types';
import { useTradingBuyForm } from '../useTradingBuyForm';

describe('useTradingBuyForm', () => {
    const renderUseTradingBuyForm = (store: TestStore) =>
        renderHookWithStoreProviderAsync(() => useTradingBuyForm(), { store });

    const getInitializedStore = async (amountInSats = false) => {
        const preloadedState: PreloadedState = {
            wallet: { tradingNew: getInitializedTradingState() },
            appSettings: {
                bitcoinUnits: amountInSats ? PROTO.AmountUnit.SATOSHI : PROTO.AmountUnit.BITCOIN,
            },
        };
        preloadedState.wallet!.tradingNew!.buy!.selectedReceiveAccount = {
            account: { key: 'btc1' } as Account,
        };

        return await initStore(preloadedState);
    };

    it('should update form value when account in redux store is changed', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            store.dispatch(
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: { key: 'btc2' } as Account },
                }),
            );
        });

        expect(result.current.getValues('receiveAccount')).toEqual({ account: { key: 'btc2' } });
    });

    it('should clear selected account on asset network change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            store.dispatch(
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: { key: 'btc2' } as Account },
                }),
            );
        });

        act(() => {
            result.current.setValue('asset', usdcAsset);
        });

        expect(result.current.getValues('receiveAccount')).toBeUndefined();
    });

    it('should not clear selected account when asset is set to undefined', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            store.dispatch(
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: { key: 'btc2' } as Account },
                }),
            );
            result.current.setValue('asset', undefined as unknown as TradeableAsset);
        });

        expect(result.current.getValues('receiveAccount')).toEqual({ account: { key: 'btc2' } });
    });

    it('should clear crypto amount on coin change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('asset', btcAsset);
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('asset', usdcAsset);
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
    });

    it('should clear crypto amount on fiat currency change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('fiatCurrency', 'eur');
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
    });

    it('should clear fiat amount on fiat currency change', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('fiatCurrency', 'eur');
        });

        expect(result.current.getValues('fiatValue')).toBeUndefined();
    });

    it('should clear cryptoValue when user edits fiatValue', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('cryptoValue', '10');
            result.current.setValue('focusedValue', 'fiatValue');
            result.current.setValue('fiatValue', '10');
        });

        expect(result.current.getValues('cryptoValue')).toBeUndefined();
        expect(result.current.getValues('fiatValue')).toEqual('10');
    });

    it('should clear fiatValue when user edits cryptoValue', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('focusedValue', 'cryptoValue');
            result.current.setValue('cryptoValue', '10');
        });

        expect(result.current.getValues('fiatValue')).toBeUndefined();
        expect(result.current.getValues('cryptoValue')).toEqual('10');
    });

    it('should set amountInCrypto to true when user edits cryptoValue', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('focusedValue', 'cryptoValue');
            result.current.setValue('cryptoValue', '10');
        });

        expect(result.current.getValues('amountInCrypto')).toBe(true);
    });

    it('should set amountInCrypto to false when user edits fiatValue', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('amountInCrypto', true);
            result.current.setValue('focusedValue', 'fiatValue');
            result.current.setValue('fiatValue', '10');
        });

        expect(result.current.getValues('amountInCrypto')).toBe(false);
    });

    it('should set payment method and provider ofter quotes are fetched', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('asset', btcAsset);
        });

        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
        });

        expect(result.current.getValues('provider')).toEqual('cexdirect');
        expect(result.current.getValues('paymentMethod')).toEqual(
            expect.objectContaining({ value: 'creditCard' }),
        );
    });

    it('should set another payment method when card is not available', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('asset', btcAsset);
        });

        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes([quotes[0]] as BuyTrade[]));
        });

        expect(result.current.getValues('provider')).toEqual('mercuryo');
        expect(result.current.getValues('paymentMethod')).toEqual(
            expect.objectContaining({ value: 'applePay' }),
        );
    });

    it('should clear payment method, provider and cryptoValue when quotes are empty and user inserted fiat', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('asset', btcAsset);
        });

        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
        });

        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes([]));
        });

        expect(result.current.getValues('provider')).toBeUndefined();
        expect(result.current.getValues('paymentMethod')).toBeUndefined();
        expect(result.current.getValues('cryptoValue')).toBeUndefined();
        expect(result.current.getValues('fiatValue')).toBe('10');
    });

    it('should clear payment method, provider and fiatValue when quotes are empty and user inserted crypto', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('amountInCrypto', true);
            result.current.setValue('asset', btcAsset);
        });

        act(() => {
            result.current.setValue('cryptoValue', '1');
            store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
        });

        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes([]));
        });

        expect(result.current.getValues('provider')).toBeUndefined();
        expect(result.current.getValues('paymentMethod')).toBeUndefined();
        expect(result.current.getValues('fiatValue')).toBeUndefined();
        expect(result.current.getValues('cryptoValue')).toBe('1');
    });

    it('should update provider and cryptoValue when payment method is changed', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('asset', btcAsset);
        });

        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
        });

        act(() => {
            result.current.setValue('paymentMethod', {
                value: 'applePay',
                label: 'Apple Pay',
            });
        });

        expect(result.current.getValues('provider')).toEqual('mercuryo');
        expect(result.current.getValues('cryptoValue')).toEqual('0.0010001683607972866');
        expect(result.current.getValues('fiatValue')).toEqual('10');
    });

    it('should update provider and fiatamount when payment method is changed', async () => {
        const store = await getInitializedStore();
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('asset', btcAsset);
        });

        act(() => {
            result.current.setValue('amountInCrypto', true);
            result.current.setValue('cryptoValue', '100');
        });

        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
        });

        act(() => {
            result.current.setValue('paymentMethod', {
                value: 'applePay',
                label: 'Apple Pay',
            });
        });

        expect(result.current.getValues('provider')).toEqual('mercuryo');
        expect(result.current.getValues('cryptoValue')).toEqual('100');
        expect(result.current.getValues('fiatValue')).toEqual('10');
    });

    it('should set correct cryptoValue when using BTC and amount in sats', async () => {
        const store = await getInitializedStore(true);
        const { result } = await renderUseTradingBuyForm(store);

        act(() => {
            result.current.setValue('fiatValue', '10');
            result.current.setValue('asset', btcAsset);
        });

        act(() => {
            store.dispatch(tradingBuyActions.saveQuotes(quotes as BuyTrade[]));
        });

        expect(result.current.getValues('cryptoValue')).toEqual('50000');
    });
});
