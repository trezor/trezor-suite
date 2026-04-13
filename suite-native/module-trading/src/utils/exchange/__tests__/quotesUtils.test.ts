import { act } from 'react';

import type { CryptoId } from 'invity-api';

import { type MinimalExchangeFormProps } from '@suite-common/trading';
import type { TokenAddress } from '@suite-common/wallet-types';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    btcAsset,
    ethAsset,
    getInitializedTradingState,
    jitoOnSolanaAsset,
    jupOnSolanaAsset,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { hasPreapprovedLimit, tradingExchangeFormToTradingExchangeFormProps } from '../quotesUtils';

describe('quotesUtils', () => {
    let form: ExchangeFormType;

    const renderUseTradingBuyForm = () =>
        renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState: { wallet: { trading: getInitializedTradingState() } },
        });

    beforeEach(() => {
        const { result } = renderUseTradingBuyForm();
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
                sendCryptoSelect: { id: 'bitcoin' as CryptoId },
                receiveCryptoSelect: { id: 'ethereum' as CryptoId },
                outputs: [{ amount: '1' }],
            } satisfies MinimalExchangeFormProps);
        });

        it('should make address lower case for eth based assets', () => {
            const alteredUsdcAsset = {
                ...usdcAsset,
                cryptoId: 'ethereum--0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48' as CryptoId,
                contractAddress: usdcAsset.contractAddress!.toUpperCase() as TokenAddress,
            };

            act(() => {
                form.setValue('sendAsset', alteredUsdcAsset);
                form.setValue('receiveAsset', alteredUsdcAsset);
                form.setValue('sendCryptoAmount', '1');
            });

            expect(tradingExchangeFormToTradingExchangeFormProps(form.getValues)).toEqual({
                sendCryptoSelect: {
                    id: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
                },
                receiveCryptoSelect: {
                    id: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
                },
                outputs: [{ amount: '1' }],
            } satisfies MinimalExchangeFormProps);
        });

        it('should not make address lower case for SOL based assets', () => {
            act(() => {
                form.setValue('sendAsset', jupOnSolanaAsset);
                form.setValue('receiveAsset', jitoOnSolanaAsset);
                form.setValue('sendCryptoAmount', '1');
            });

            expect(tradingExchangeFormToTradingExchangeFormProps(form.getValues)).toEqual({
                sendCryptoSelect: {
                    id: 'solana--JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as CryptoId,
                },
                receiveCryptoSelect: {
                    id: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL' as CryptoId,
                },
                outputs: [{ amount: '1' }],
            } satisfies MinimalExchangeFormProps);
        });
    });

    describe('hasPreapprovedLimit', () => {
        it.each([
            ['quote is undefined', undefined],
            ['quote.preapprovedStringAmount is undefined', {}],
            ['quote.preapprovedStringAmount is empty string', { preapprovedStringAmount: '' }],
            ['quote.preapprovedStringAmount is "0"', { preapprovedStringAmount: '0' }],
        ])('should be false when %s', (_, quote) => {
            expect(hasPreapprovedLimit(quote)).toBe(false);
        });

        it('should be true when preapprovedStringAmount is 11', () => {
            expect(hasPreapprovedLimit({ preapprovedStringAmount: '11' })).toBe(true);
        });
    });
});
