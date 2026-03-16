import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import { type AccountKey } from '@suite-common/wallet-types';
import { exchangeInvity, sellInvity } from '@suite-native/trading-fixtures';

import { createFormStateForSendForm } from '../tradingFormUtils';

describe('createFormStateForSendForm', () => {
    describe('createTradingFormState', () => {
        const sendAccountKey = 'send-account-key' as AccountKey;
        it('should create FormState for exchange quote (swap)', () => {
            const exchangeQuote: ExchangeTrade = {
                exchange: 'sideshiftfr',
                send: 'solana' as any,
                sendStringAmount: '25.000000000',
                sendAddress: 'CDmq8nBcGJrSCjWfAtUTGwQV9jjpqcDcVA6cyH1GNo4F',
                receive: 'solana' as any,
                receiveStringAmount: '0.1314322',
                receiveAddress: '9joo3pq4ya3U3MpCTybk9Ac8hVNQc4Xb6zyU6aTAe3Fc',
                status: 'CONFIRM',
                orderId: 'ca704f66ded5d2e02938',
                quoteId: 'eb6ac883-5f77-4169-896f-3d3bbb232e70',
            };

            const feeLevel = {
                label: 'normal' as const,
                feePerUnit: '0.000005',
                feeLimit: '21000',
            };
            const providers = { sideshiftfr: exchangeInvity };
            const formState = createFormStateForSendForm({
                quote: exchangeQuote,
                feeLevel,
                providers,
                sendAccountKey,
            });

            expect(formState.outputs).toHaveLength(1);
            expect(formState.outputs[0]).toEqual({
                type: 'payment',
                address: 'CDmq8nBcGJrSCjWfAtUTGwQV9jjpqcDcVA6cyH1GNo4F',
                amount: '25.000000000',
                fiat: '',
                currency: { label: '', value: '' },
                label: '',
                token: null,
            });

            expect(formState.selectedFee).toBe('normal');
            expect(formState.feePerUnit).toBe('0.000005');
            expect(formState.feeLimit).toBe('21000');
        });

        it('should create FormState for sell quote (crypto to fiat)', () => {
            const sellQuote = {
                amountInCrypto: false,
                country: 'CZ',
                cryptoCurrency: 'bitcoin',
                cryptoStringAmount: '0.001',
                exchange: 'invity',
                fiatCurrency: 'USD',
                fiatStringAmount: '45.67',
                maxCrypto: 1.0,
                maxFiat: 10000,
                minCrypto: 0.0001,
                minFiat: 20,
                orderId: 'sell-fiat-123',
                paymentId: 'payment-456',
                paymentMethod: 'creditCard',
                paymentMethodName: 'Credit Card',
                rate: 45670.0,
                tags: ['wantFiat'],
                destinationAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            } as SellFiatTrade;

            const providers = { invity: sellInvity };
            const formState = createFormStateForSendForm({
                quote: sellQuote,
                providers,
                sendAccountKey,
            });

            expect(formState.outputs).toHaveLength(1);
            expect(formState.outputs[0]).toEqual({
                type: 'payment',
                address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                amount: '0.001',
                fiat: '',
                currency: { label: '', value: '' },
                label: '',
                token: null,
            });
        });

        it('should handle token contracts correctly', () => {
            const tokenQuote: ExchangeTrade = {
                exchange: 'invity',
                send: 'ethereum--0x0987654321123456789012345678901234567890' as any,
                sendStringAmount: '100.0',
                sendAddress: '0x1234567890123456789012345678901234567890',
                receive: 'ethereum' as any,
                receiveStringAmount: '10.0',
                status: 'CONFIRM',
                orderId: 'token-swap-123',
                quoteId: 'token-quote-456',
            };

            const providers = { invity: exchangeInvity };
            const formState = createFormStateForSendForm({
                quote: tokenQuote,
                providers,
                sendAccountKey,
            });

            expect(formState.outputs[0].token).toBe('0x0987654321123456789012345678901234567890');
            expect(formState.outputs[0].address).toBe('0x1234567890123456789012345678901234567890');
            expect(formState.outputs[0].amount).toBe('100.0');
        });

        it('should handle extra fields (destinationTag)', () => {
            const xrpQuote: ExchangeTrade = {
                exchange: 'changelly',
                send: 'ripple' as any,
                sendStringAmount: '100.0',
                sendAddress: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                receive: 'bitcoin' as any,
                receiveStringAmount: '0.001',
                partnerPaymentExtraId: '12345',
                status: 'CONFIRM',
                orderId: 'xrp-btc-123',
                quoteId: 'xrp-quote-456',
            };

            const providers = { changelly: exchangeInvity };
            const formState = createFormStateForSendForm({
                quote: xrpQuote,
                providers,
                sendAccountKey,
            });

            expect(formState.destinationTag).toBe('12345');
        });

        it('should use custom extra field when provided', () => {
            const quote: SellFiatTrade = {
                amountInCrypto: false,
                country: 'CZ',
                cryptoCurrency: 'bitcoin' as any,
                cryptoStringAmount: '0.001',
                exchange: 'invity',
                fiatCurrency: 'USD',
                fiatStringAmount: '45.67',
                maxCrypto: 1.0,
                maxFiat: 10000,
                minCrypto: 0.0001,
                minFiat: 20,
                orderId: 'test-123',
                paymentId: 'payment-456',
                paymentMethod: 'creditCard',
                paymentMethodName: 'Credit Card',
                rate: 45670.0,
                tags: ['wantFiat'],
                destinationAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            };

            const customExtraField = 'custom-tag-123';
            const providers = { invity: sellInvity };
            const formState = createFormStateForSendForm({
                quote,
                extraField: customExtraField,
                providers,
                sendAccountKey,
            });

            expect(formState.destinationTag).toBe('custom-tag-123');
        });

        it('should throw error for invalid quote type', () => {
            // Since the mock isExchangeTrade always returns true, we need to provide a quote that will fail
            // when the function tries to process it as an exchange trade
            const invalidQuote = {
                exchange: 'test',
                status: 'CONFIRM',
                // Missing 'send' property which will cause the function to fail when trying to get network symbol
            };

            const providers = { test: exchangeInvity };
            expect(() =>
                createFormStateForSendForm({
                    quote: invalidQuote as any,
                    providers,
                    sendAccountKey,
                }),
            ).toThrow('Invalid quote type: must be ExchangeTrade or SellFiatTrade');
        });

        it('should set transactionData and output address from dexTx for DEX quotes', () => {
            const dexQuote: ExchangeTrade = {
                exchange: '1inch',
                send: 'ethereum' as any,
                sendStringAmount: '1.0',
                sendAddress: '0xUserAddress',
                receive: 'ethereum--0xTokenAddress' as any,
                receiveStringAmount: '1000.0',
                status: 'CONFIRM',
                orderId: 'dex-order-123',
                quoteId: 'dex-quote-456',
                isDex: true,
                dexTx: {
                    from: '0xUserAddress',
                    to: '0xDexRouterAddress',
                    data: '0xabcdef1234567890',
                    value: '1000000000000000000',
                },
            };

            const providers = { '1inch': exchangeInvity };
            const formState = createFormStateForSendForm({
                quote: dexQuote,
                providers,
                sendAccountKey,
            });

            // DEX output address should come from dexTx.to, not sendAddress
            expect(formState.outputs[0].address).toBe('0xDexRouterAddress');
            expect(formState.transactionData).toBe('0xabcdef1234567890');
            expect(formState.ethereumAdjustGasLimit).toBe('1.25');
        });

        it('should not apply gas limit adjustment for DEX approval transactions', () => {
            const dexApprovalQuote: ExchangeTrade = {
                exchange: '1inch',
                send: 'ethereum--0xTokenAddress' as any,
                sendStringAmount: '100.0',
                sendAddress: '0xUserAddress',
                receive: 'ethereum' as any,
                receiveStringAmount: '0.5',
                status: 'APPROVAL_REQ',
                orderId: 'dex-approval-123',
                quoteId: 'dex-approval-456',
                isDex: true,
                dexTx: {
                    from: '0xUserAddress',
                    to: '0xDexRouterAddress',
                    data: '0xapprovaldata',
                    value: '0',
                },
            };

            const providers = { '1inch': exchangeInvity };
            const formState = createFormStateForSendForm({
                quote: dexApprovalQuote,
                providers,
                sendAccountKey,
            });

            expect(formState.outputs[0].address).toBe('0xDexRouterAddress');
            expect(formState.transactionData).toBe('0xapprovaldata');
            // No gas adjustment for approval transactions
            expect(formState.ethereumAdjustGasLimit).toBe('');
        });

        it('should not set DEX fields for CEX exchange quotes', () => {
            const cexQuote: ExchangeTrade = {
                exchange: 'changelly',
                send: 'ethereum' as any,
                sendStringAmount: '1.0',
                sendAddress: '0xChangellyDepositAddress',
                receive: 'bitcoin' as any,
                receiveStringAmount: '0.05',
                status: 'CONFIRM',
                orderId: 'cex-order-123',
                quoteId: 'cex-quote-456',
                isDex: false,
            };

            const providers = { changelly: exchangeInvity };
            const formState = createFormStateForSendForm({
                quote: cexQuote,
                providers,
                sendAccountKey,
            });

            expect(formState.outputs[0].address).toBe('0xChangellyDepositAddress');
            expect(formState.transactionData).toBe('');
            expect(formState.ethereumAdjustGasLimit).toBe('');
        });

        it('should use default fee level when not provided', () => {
            const quote: ExchangeTrade = {
                exchange: 'test',
                send: 'bitcoin' as any,
                sendStringAmount: '0.001',
                sendAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                receive: 'ethereum' as any,
                receiveStringAmount: '0.001',
                status: 'CONFIRM',
                orderId: 'test-123',
                quoteId: 'test-456',
            };

            const providers = { test: exchangeInvity };
            const formState = createFormStateForSendForm({ quote, providers, sendAccountKey });

            expect(formState.selectedFee).toBe('normal');
            expect(formState.feePerUnit).toBe('');
            expect(formState.feeLimit).toBe('');
        });
    });
});
