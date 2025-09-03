import { act } from 'react';

import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { btcAsset, ethAsset } from '../../../__fixtures__/tradeableAssets';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../types/exchange';
import { tradingExchangeFormToTradingExchangeFormProps } from '../quotesUtils';

describe('quotesUtils', () => {
    let form: ExchangeFormType;

    const renderUseTradingBuyForm = () =>
        renderHookWithStoreProviderAsync(() => useExchangeForm(), {
            preloadedState: { wallet: { trading: getInitializedTradingState() } },
        });

    beforeEach(async () => {
        const { result } = await renderUseTradingBuyForm();
        form = result.current;
    });

    describe('tradingExchangeFormToTradingExchangeFormProps', () => {
        it('should throw when sendAsset is not specified', () => {
            expect(() => tradingExchangeFormToTradingExchangeFormProps(form.getValues)).toThrow(
                'sendAsset is required',
            );
        });

        it('should throw when receiveAsset is not specified', () => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
            });

            expect(() => tradingExchangeFormToTradingExchangeFormProps(form.getValues)).toThrow(
                'receiveAsset is required',
            );
        });

        it('should throw when sendCryptoAmount is not specified', () => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('receiveAsset', ethAsset);
            });

            expect(() => tradingExchangeFormToTradingExchangeFormProps(form.getValues)).toThrow(
                'sendCryptoAmount is required',
            );
        });

        it('should return correct TradingExchangeFormProps when all values are set', () => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('receiveAsset', ethAsset);
                form.setValue('sendCryptoAmount', '1');
            });

            expect(tradingExchangeFormToTradingExchangeFormProps(form.getValues)).toEqual({
                sendCryptoSelect: { value: 'bitcoin' },
                receiveCryptoSelect: { value: 'ethereum' },
                outputs: [{ amount: '1' }],
            });
        });
    });
});
