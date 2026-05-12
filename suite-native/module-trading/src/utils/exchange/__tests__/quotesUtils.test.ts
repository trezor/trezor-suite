import { act } from 'react';

import type { CryptoId } from 'invity-api';

import { type MinimalExchangeFormProps } from '@suite-common/trading';
import type { TokenAddress } from '@suite-common/wallet-types';
import {
    btc1NormalAccount,
    btcAsset,
    eth1NormalAccount,
    ethAsset,
    getInitializedTradingState,
    jitoOnSolanaAsset,
    jupOnSolanaAsset,
    usdcAsset,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormType, type ReceiveAccount } from '@suite-native/trading-types';

import { renderHookWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { hasPreapprovedLimit, tradingExchangeFormToTradingExchangeFormProps } from '../quotesUtils';

describe('quotesUtils', () => {
    let form: ExchangeFormType;

    const renderUseTradingBuyForm = () =>
        renderHookWithTradingProvider(() => useExchangeForm(), {
            overrides: { wallet: { trading: getInitializedTradingState() } },
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

        it('should include fromAddress when provided', () => {
            act(() => {
                form.setValue('sendAsset', ethAsset);
                form.setValue('receiveAsset', btcAsset);
                form.setValue('sendCryptoAmount', '1');
                form.setValue('sendAccount', eth1NormalAccount);
            });

            expect(tradingExchangeFormToTradingExchangeFormProps(form.getValues)).toEqual({
                sendCryptoSelect: { id: 'ethereum' as CryptoId },
                receiveCryptoSelect: { id: 'bitcoin' as CryptoId },
                outputs: [{ amount: '1' }],
                fromAddress: 'eth1-normal',
            } satisfies MinimalExchangeFormProps);
        });

        it('should not use btc account descriptor', () => {
            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('receiveAsset', ethAsset);
                form.setValue('sendCryptoAmount', '1');
                form.setValue('sendAccount', btc1NormalAccount);
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

        it('should include receiveAddress when receiveAccount has an address', () => {
            const receiveAccount: ReceiveAccount = {
                account: btc1NormalAccount,
                address: {
                    address: 'btc-receive-addr',
                    path: "m/44'/0'/0'/0/0",
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
            };

            act(() => {
                form.setValue('sendAsset', ethAsset);
                form.setValue('receiveAsset', btcAsset);
                form.setValue('sendCryptoAmount', '1');
                form.setValue('receiveAccount', receiveAccount);
            });

            expect(tradingExchangeFormToTradingExchangeFormProps(form.getValues)).toEqual({
                sendCryptoSelect: { id: 'ethereum' as CryptoId },
                receiveCryptoSelect: { id: 'bitcoin' as CryptoId },
                outputs: [{ amount: '1' }],
                receiveAddress: 'btc-receive-addr',
            } satisfies MinimalExchangeFormProps);
        });

        it('should not fall back to account descriptor for BTC when no address is set', () => {
            const receiveAccount: ReceiveAccount = {
                account: btc1NormalAccount,
            };

            act(() => {
                form.setValue('sendAsset', ethAsset);
                form.setValue('receiveAsset', btcAsset);
                form.setValue('sendCryptoAmount', '1');
                form.setValue('receiveAccount', receiveAccount);
            });

            expect(tradingExchangeFormToTradingExchangeFormProps(form.getValues)).toEqual({
                sendCryptoSelect: { id: 'ethereum' as CryptoId },
                receiveCryptoSelect: { id: 'bitcoin' as CryptoId },
                outputs: [{ amount: '1' }],
            } satisfies MinimalExchangeFormProps);
        });

        it('should use  account descriptor for non-btc like networks', () => {
            const receiveAccount: ReceiveAccount = {
                account: eth1NormalAccount,
            };

            act(() => {
                form.setValue('sendAsset', btcAsset);
                form.setValue('receiveAsset', ethAsset);
                form.setValue('sendCryptoAmount', '1');
                form.setValue('receiveAccount', receiveAccount);
            });

            expect(tradingExchangeFormToTradingExchangeFormProps(form.getValues)).toEqual({
                sendCryptoSelect: { id: 'bitcoin' as CryptoId },
                receiveCryptoSelect: { id: 'ethereum' as CryptoId },
                outputs: [{ amount: '1' }],
                receiveAddress: eth1NormalAccount.descriptor,
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
