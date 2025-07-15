import { tradingExchangeActions } from '@suite-common/trading';
import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { PROTO } from '@trezor/connect';

import { getBtcAccount } from '../../../__fixtures__/account';
import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { btcAsset } from '../../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useExchangeForm } from '../useExchangeForm';

describe('useExchangeForm', () => {
    const renderUseExchangeForm = (store: TestStore) =>
        renderHookWithStoreProviderAsync(() => useExchangeForm(), { store });

    const getInitializedStore = async (bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN) => {
        const preloadedState: PreloadedState = {
            wallet: {
                tradingNew: getInitializedTradingState(),
                settings: {
                    bitcoinAmountUnit,
                },
                accounts: [getBtcAccount('btc-account-1'), getBtcAccount('btc-account-2')],
            },
        };
        preloadedState.wallet!.tradingNew!.buy!.tradingAccountKey = 'btc-account-1';

        return await initStore(preloadedState);
    };

    describe('on quotes change', () => {
        it('should select fixed quote with best rate', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'mercuryo-fixed-best',
                }),
            );
        });

        it('should select floating quote when fixed is not available', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);
            act(() => {
                store.dispatch(
                    tradingExchangeActions.saveQuotes([exchangeQuotes[2], exchangeQuotes[3]]),
                );
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'cexdirect-floating',
                }),
            );
        });

        it('should select dex quote when no other quotes are available', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes([exchangeQuotes[3]]));
            });

            expect(result.current.getValues('quote')).toEqual(
                expect.objectContaining({
                    quoteId: 'invity-dex',
                }),
            );
        });

        it('should set quote to undefined when no quotes are available', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes([]));
            });

            expect(result.current.getValues('quote')).toBeUndefined();
        });

        it('should set receiveCryptoAmount based on selected quote', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);
            act(() => {
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });

            expect(result.current.getValues('receiveCryptoAmount')).toBe('0.00089537');
        });

        it('should sets receiveCryptoAmount in sats when using BTC and amount in sats', async () => {
            const store = await getInitializedStore(PROTO.AmountUnit.SATOSHI);
            const { result } = await renderUseExchangeForm(store);
            act(() => {
                result.current.setValue('receiveAsset', btcAsset);
                store.dispatch(tradingExchangeActions.saveQuotes(exchangeQuotes));
            });

            expect(result.current.getValues('receiveCryptoAmount')).toBe('89537');
        });
    });

    describe('sendAccount', () => {
        it('should be undefined by default', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);

            expect(result.current.getValues('sendAccount')).toBeUndefined();
        });

        it('should update sendAccount value when account in redux store is changed', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
            });

            expect(result.current.getValues('sendAccount')).toEqual(getBtcAccount('btc-account-1'));
        });
    });

    describe('receiveAccount', () => {
        it('should be undefined by default', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);

            expect(result.current.getValues('receiveAccount')).toBeUndefined();
        });

        it('should update receiveAccount value when account in redux store is changed', async () => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);

            act(() => {
                store.dispatch(tradingExchangeActions.setReceiveAccountKey('btc-account-1'));
            });

            expect(result.current.getValues('receiveAccount')).toEqual(
                expect.objectContaining({
                    account: getBtcAccount('btc-account-1'),
                }),
            );
        });
    });
});
