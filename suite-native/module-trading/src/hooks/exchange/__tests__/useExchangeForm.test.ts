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
import { btcAsset, usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { getWalletState } from '../../../__fixtures__/walletState';
import { useExchangeForm } from '../useExchangeForm';

describe('useExchangeForm', () => {
    const renderUseExchangeForm = (store: TestStore) =>
        renderHookWithStoreProviderAsync(() => useExchangeForm(), { store });

    const getInitializedStore = async (bitcoinAmountUnit = PROTO.AmountUnit.BITCOIN) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({
                bitcoinAmountUnit,
            }),
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

    describe('validations', () => {
        it.each([
            ['0.00001', 'Minimum is 0.0001 BTC'],
            ['100', 'Maximum is 50 BTC'],
            ['1', 'Insufficient balance'],
        ])('should display error for crypto amount %s BTC', async (amount, expectedValue) => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
                result.current.setValue('sendAsset', btcAsset);
                result.current.setValue('sendCryptoAmount', amount);
            });

            await act(() => result.current.trigger('sendCryptoAmount'));

            const { error, invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(true);
            expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
        });

        it.each([
            ['100', 'Minimum is 10000 sat'],
            ['10000000000', 'Maximum is 5000000000 sat'],
            ['10000000', 'Insufficient balance'],
        ])('should display error for crypto amount %s SATS', async (amount, expectedValue) => {
            const store = await getInitializedStore(PROTO.AmountUnit.SATOSHI);
            const { result } = await renderUseExchangeForm(store);

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
                result.current.setValue('sendAsset', btcAsset);
                result.current.setValue('sendCryptoAmount', amount);
            });

            await act(() => result.current.trigger('sendCryptoAmount'));

            const { error, invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(true);
            expect(error).toEqual(expect.objectContaining({ message: expectedValue }));
        });

        it('should correctly compute balance with SATS', async () => {
            const store = await getInitializedStore(PROTO.AmountUnit.SATOSHI);
            const { result } = await renderUseExchangeForm(store);

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey('btc-account-1'));
                result.current.setValue('sendAsset', btcAsset);
                result.current.setValue('sendCryptoAmount', '10000');
            });

            await act(() => result.current.trigger('sendCryptoAmount'));

            const { invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(false);
        });

        it.each<[string, boolean]>([
            ['1', false],
            ['2', true],
        ])('should use correct balance for USDC and amount %s', async (amount, expectedInvalid) => {
            const store = await getInitializedStore();
            const { result } = await renderUseExchangeForm(store);

            act(() => {
                store.dispatch(tradingExchangeActions.setTradingAccountKey('eth-account-1'));
                result.current.setValue('sendAsset', usdcAsset);
                result.current.setValue('sendCryptoAmount', amount);
            });

            await act(() => result.current.trigger('sendCryptoAmount'));

            const { invalid } = result.current.getFieldState('sendCryptoAmount');

            expect(invalid).toBe(expectedInvalid);
        });
    });
});
