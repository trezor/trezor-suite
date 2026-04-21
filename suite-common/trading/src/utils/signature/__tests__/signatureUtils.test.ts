import { type CryptoId, type ExchangeProviderInfo, type SellProviderInfo } from 'invity-api';

import {
    tradingExchangeCreatePaymentRequest,
    tradingSellCreatePaymentRequest,
} from '../signatureUtils';

// Mock external dependencies
jest.mock('../../../utils', () => ({
    cryptoIdToNetworkAndContractAddress: jest
        .fn()
        .mockImplementation((cryptoId: CryptoId | undefined) => {
            if (cryptoId === 'ethereum') {
                return {
                    network: { decimals: 18, networkType: 'ethereum', symbol: 'eth' },
                    contractAddress: undefined,
                };
            }

            return {
                network: { decimals: 8, networkType: 'bitcoin', symbol: 'btc' },
                contractAddress: undefined,
            };
        }),
}));

describe('signatureUtils', () => {
    describe('tradingExchangeCreatePaymentRequest', () => {
        const mockTrade = {
            send: 'bitcoin' as CryptoId,
            sendStringAmount: '0.1',
            receive: 'ethereum' as CryptoId,
            receiveStringAmount: '2.5',
            receiveAddress: '0x1234567890123456789012345678901234567890',
            refundAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            tradeSignature: 'mockedSignature123',
        };

        const mockProvider: ExchangeProviderInfo = {
            companyName: 'TestExchange',
            name: 'testexchange',
            logo: 'test.png',
            isActive: true,
            isFixedRate: false,
            isDex: false,
            buyTickers: [],
            sellTickers: [],
            addressFormats: {},
            statusUrl: 'https://test.io/exchange/txs/{{orderId}}',
            supportUrl: 'https://support.test.io',
            kycPolicy: 'KYC is required',
            kycPolicyType: 'KYC-required',
        };

        const defaultProps = {
            trade: mockTrade,
            provider: mockProvider,
            macPurchase: 'macPurchase123',
            pathPurchase: "m/44'/0'/0'/1/0",
            macRefund: 'macRefund456',
            pathRefund: "m/44'/0'/0'/1/0",
            nonce: 'nonce789',
            sendSlip44: 0,
            receiveSlip44: 60,
            receiveDisplaySymbol: 'ETH',
            sendStringAmount: mockTrade.sendStringAmount,
        };

        it('should create valid payment request for exchange trade', () => {
            const result = tradingExchangeCreatePaymentRequest(defaultProps);

            expect(result).toEqual({
                recipient_name: 'TestExchange',
                nonce: 'nonce789',
                amount: '10000000', // subunits (satoshis) for 0.1 BTC
                memos: [
                    {
                        coin_purchase_memo: {
                            address: '0x1234567890123456789012345678901234567890',
                            amount: '2.5 ETH',
                            coin_type: 60, // ethereum coin type
                            mac: 'macPurchase123',
                            address_n: [2147483692, 2147483648, 2147483648, 1, 0],
                        },
                    },
                    {
                        refund_memo: {
                            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                            mac: 'macRefund456',
                            address_n: [2147483692, 2147483648, 2147483648, 1, 0],
                        },
                    },
                ],
                signature: 'mockedSignature123',
            });
        });

        it('should return undefined when provider companyName is missing', () => {
            const propsWithoutCompanyName = {
                ...defaultProps,
                provider: { ...mockProvider, companyName: undefined as any },
            };

            const result = tradingExchangeCreatePaymentRequest(propsWithoutCompanyName);

            expect(result).toBeUndefined();
        });

        it('should return undefined when trade send is missing', () => {
            const propsWithoutSend = {
                ...defaultProps,
                trade: { ...mockTrade, send: undefined as any },
            };

            const result = tradingExchangeCreatePaymentRequest(propsWithoutSend);

            expect(result).toBeUndefined();
        });

        it('should return undefined when trade sendStringAmount is missing', () => {
            const propsWithoutSendAmount = {
                ...defaultProps,
                trade: { ...mockTrade },
                sendStringAmount: undefined as any,
            };

            const result = tradingExchangeCreatePaymentRequest(propsWithoutSendAmount);

            expect(result).toBeUndefined();
        });

        it('should return undefined when trade receive is missing', () => {
            const propsWithoutReceive = {
                ...defaultProps,
                trade: { ...mockTrade, receive: undefined as any },
            };

            const result = tradingExchangeCreatePaymentRequest(propsWithoutReceive);

            expect(result).toBeUndefined();
        });

        it('should return undefined when trade receiveStringAmount is missing', () => {
            const propsWithoutReceiveAmount = {
                ...defaultProps,
                trade: { ...mockTrade, receiveStringAmount: undefined as any },
            };

            const result = tradingExchangeCreatePaymentRequest(propsWithoutReceiveAmount);

            expect(result).toBeUndefined();
        });

        it('should return undefined when trade receiveAddress is missing', () => {
            const propsWithoutReceiveAddress = {
                ...defaultProps,
                trade: { ...mockTrade, receiveAddress: undefined as any },
            };

            const result = tradingExchangeCreatePaymentRequest(propsWithoutReceiveAddress);

            expect(result).toBeUndefined();
        });

        it('should return undefined when trade refundAddress is missing', () => {
            const propsWithoutRefundAddress = {
                ...defaultProps,
                trade: { ...mockTrade, refundAddress: undefined as any },
            };

            const result = tradingExchangeCreatePaymentRequest(propsWithoutRefundAddress);

            expect(result).toBeUndefined();
        });

        it('should handle testnet coins correctly', () => {
            const testnetTrade = {
                ...mockTrade,
                receive: 'test-bitcoin' as CryptoId,
            };

            const propsWithTestnet = {
                ...defaultProps,
                trade: testnetTrade,
                receiveSlip44: 1,
            };

            const result = tradingExchangeCreatePaymentRequest(propsWithTestnet);

            expect(result).toBeDefined();
            if (result && result.memos && result.memos[0]) {
                expect(result.memos[0].coin_purchase_memo?.coin_type).toBe(1); // ALL_TESTNETS - HARDENED_OFFSET
            }
        });

        it('should handle Bitcoin Cash correctly', () => {
            const bchTrade = {
                ...mockTrade,
                receive: 'bitcoin-cash' as CryptoId,
            };

            const propsWithBch = {
                ...defaultProps,
                trade: bchTrade,
                receiveSlip44: 145,
            };

            const result = tradingExchangeCreatePaymentRequest(propsWithBch);

            expect(result).toBeDefined();
            if (result && result.memos && result.memos[0]) {
                expect(result.memos[0].coin_purchase_memo?.coin_type).toBe(145); // BCH coin type
            }
        });

        it('should handle Litecoin correctly', () => {
            const ltcTrade = {
                ...mockTrade,
                receive: 'litecoin' as CryptoId,
            };

            const propsWithLtc = {
                ...defaultProps,
                trade: ltcTrade,
                receiveSlip44: 2,
            };

            const result = tradingExchangeCreatePaymentRequest(propsWithLtc);

            expect(result).toBeDefined();
            if (result && result.memos && result.memos[0]) {
                expect(result.memos[0].coin_purchase_memo?.coin_type).toBe(2); // LTC coin type
            }
        });
    });

    describe('tradingSellCreatePaymentRequest', () => {
        const mockSellTrade = {
            cryptoCurrency: 'bitcoin' as CryptoId,
            cryptoStringAmount: '0.5',
            refundAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            tradeSignature: 'mockedSellSignature456',
        };

        const mockSellProvider: SellProviderInfo = {
            companyName: 'TestSeller',
            name: 'testseller',
            logo: 'seller.png',
            isActive: true,
            tradedCoins: [],
            tradedFiatCurrencies: [],
            supportedCountries: [],
            paymentMethods: [],
            statusUrl: 'https://test.com/status',
            supportUrl: 'https://test.com/support',
            type: 'Fiat',
            supportedSubdivisions: {},
        };

        const defaultSellProps = {
            trade: mockSellTrade,
            provider: mockSellProvider,
            macRefund: 'sellMacRefund789',
            pathRefund: "m/44'/0'/0'/1/0",
            nonce: 'sellNonce123',
            memoText: 'Test memo text',
            sendStringAmount: mockSellTrade.cryptoStringAmount,
        };

        it('should create valid payment request for sell trade', () => {
            const result = tradingSellCreatePaymentRequest(defaultSellProps);

            expect(result).toEqual({
                recipient_name: 'TestSeller',
                nonce: 'sellNonce123',
                amount: '50000000', // subunits (satoshis) for 0.5 BTC
                memos: [
                    {
                        text_memo: {
                            text: 'Test memo text',
                        },
                    },
                    {
                        refund_memo: {
                            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                            mac: 'sellMacRefund789',
                            address_n: [2147483692, 2147483648, 2147483648, 1, 0],
                        },
                    },
                ],
                signature: 'mockedSellSignature456',
            });
        });

        it('should return undefined when provider companyName is missing', () => {
            const propsWithoutCompanyName = {
                ...defaultSellProps,
                provider: { ...mockSellProvider, companyName: undefined as any },
            };

            const result = tradingSellCreatePaymentRequest(propsWithoutCompanyName);

            expect(result).toBeUndefined();
        });

        it('should return undefined when trade refundAddress is missing', () => {
            const propsWithoutRefundAddress = {
                ...defaultSellProps,
                trade: { ...mockSellTrade, refundAddress: undefined as any },
            };

            const result = tradingSellCreatePaymentRequest(propsWithoutRefundAddress);

            expect(result).toBeUndefined();
        });

        it('should return undefined when trade tradeSignature is missing', () => {
            const propsWithoutSignature = {
                ...defaultSellProps,
                trade: { ...mockSellTrade, tradeSignature: undefined as any },
            };

            const result = tradingSellCreatePaymentRequest(propsWithoutSignature);

            expect(result).toBeUndefined();
        });

        it('should return undefined when trade cryptoStringAmount is missing', () => {
            const propsWithoutAmount = {
                ...defaultSellProps,
                trade: { ...mockSellTrade, cryptoStringAmount: undefined as any },
            };

            const result = tradingSellCreatePaymentRequest(propsWithoutAmount);

            expect(result).toBeUndefined();
        });

        it('should return undefined when trade cryptoCurrency is missing', () => {
            const propsWithoutCurrency = {
                ...defaultSellProps,
                trade: { ...mockSellTrade, cryptoCurrency: undefined as any },
            };

            const result = tradingSellCreatePaymentRequest(propsWithoutCurrency);

            expect(result).toBeUndefined();
        });

        it('should handle different crypto currencies correctly', () => {
            const ethTrade = {
                ...mockSellTrade,
                cryptoCurrency: 'ethereum' as CryptoId,
                cryptoStringAmount: '10.5',
            };

            const propsWithEth = {
                ...defaultSellProps,
                trade: ethTrade,
                sendStringAmount: ethTrade.cryptoStringAmount,
            };

            const result = tradingSellCreatePaymentRequest(propsWithEth);

            expect(result).toBeDefined();
            expect(result?.amount).toBe('10500000000000000000'); // subunits (wei) for 10.5 ETH
        });

        it('should handle empty memo text', () => {
            const propsWithEmptyMemo = {
                ...defaultSellProps,
                memoText: '',
            };

            const result = tradingSellCreatePaymentRequest(propsWithEmptyMemo);

            expect(result).toBeDefined();
            if (result && result.memos && result.memos[0]) {
                expect(result.memos[0].text_memo?.text).toBe('');
            }
        });

        it('should handle special characters in memo text', () => {
            const propsWithSpecialMemo = {
                ...defaultSellProps,
                memoText: 'Special chars: àáâãäåæçèéêë',
            };

            const result = tradingSellCreatePaymentRequest(propsWithSpecialMemo);

            expect(result).toBeDefined();
            if (result && result.memos && result.memos[0]) {
                expect(result.memos[0].text_memo?.text).toBe('Special chars: àáâãäåæçèéêë');
            }
        });
    });

    describe('Edge cases and error handling', () => {
        it('should handle very large amounts correctly', () => {
            const largeTrade = {
                send: 'bitcoin' as CryptoId,
                sendStringAmount: '999999.99999999',
                receive: 'ethereum' as CryptoId,
                receiveStringAmount: '1000000.12345678',
                receiveAddress: '0x1234567890123456789012345678901234567890',
                refundAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                tradeSignature: 'largeAmountSignature',
            };

            const provider: ExchangeProviderInfo = {
                companyName: 'TestExchange',
                name: 'testexchange',
                logo: 'test.png',
                isActive: true,
                isFixedRate: false,
                isDex: false,
                buyTickers: [],
                sellTickers: [],
                addressFormats: {},
                statusUrl: 'https://test.io/exchange/txs/{{orderId}}',
                kycUrl: 'https://test.io/faq#kyc',
                supportUrl: 'https://support.test.io',
                kycPolicy: 'KYC is required',
                kycPolicyType: 'KYC-required',
            };

            const result = tradingExchangeCreatePaymentRequest({
                trade: largeTrade,
                provider,
                macPurchase: 'mac1',
                pathPurchase: "m/44'/0'/0'/1/0",
                macRefund: 'mac2',
                pathRefund: "m/44'/0'/0'/1/0",
                nonce: 'nonce',
                receiveSlip44: 60,
                receiveDisplaySymbol: 'ETH',
                sendStringAmount: largeTrade.sendStringAmount,
            });

            expect(result).toBeDefined();
            if (result && result.memos && result.memos[0]) {
                expect(result.amount).toBe('99999999999999'); // subunits (satoshis)
                expect(result.memos[0].coin_purchase_memo?.amount).toBe('1000000.12345678 ETH');
            }
        });

        it('should handle very small amounts correctly', () => {
            const smallTrade = {
                send: 'bitcoin' as CryptoId,
                sendStringAmount: '0.00000001',
                receive: 'ethereum' as CryptoId,
                receiveStringAmount: '0.00000001',
                receiveAddress: '0x1234567890123456789012345678901234567890',
                refundAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                tradeSignature: 'smallAmountSignature',
            };

            const provider: ExchangeProviderInfo = {
                companyName: 'TestExchange',
                name: 'testexchange',
                logo: 'test.png',
                isActive: true,
                isFixedRate: false,
                isDex: false,
                buyTickers: [],
                sellTickers: [],
                addressFormats: {},
                statusUrl: 'https://test.io/exchange/txs/{{orderId}}',
                kycUrl: 'https://test.io/faq#kyc',
                supportUrl: 'https://support.test.io',
                kycPolicy: 'KYC is required',
                kycPolicyType: 'KYC-required',
            };

            const result = tradingExchangeCreatePaymentRequest({
                trade: smallTrade,
                provider,
                macPurchase: 'mac1',
                pathPurchase: "m/44'/0'/0'/1/0",
                macRefund: 'mac2',
                pathRefund: "m/44'/0'/0'/1/0",
                nonce: 'nonce',
                receiveSlip44: 60,
                receiveDisplaySymbol: 'ETH',
                sendStringAmount: smallTrade.sendStringAmount,
            });

            expect(result).toBeDefined();
            if (result && result.memos && result.memos[0]) {
                expect(result.amount).toBe('1'); // subunits (satoshis)
                expect(result.memos[0].coin_purchase_memo?.amount).toBe('0.00000001 ETH');
            }
        });
    });
});
