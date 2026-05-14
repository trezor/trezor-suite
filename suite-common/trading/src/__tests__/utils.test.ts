import {
    type CryptoId,
    type ExchangeProviderInfo,
    type ExchangeTrade,
    type SellFiatTrade,
} from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { Account, AccountKey } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import * as BUY_FIXTURE from '../__fixtures__/buyUtils';
import * as EXCHANGE_FIXTURE from '../__fixtures__/exchangeUtils';
import * as SELL_FIXTURE from '../__fixtures__/sellUtils';
import { accountBtc, accountEth } from '../__fixtures__/utils';
import type { TradingExchangeType, TradingSellType } from '../types';
import {
    addIdsToQuotes,
    cryptoIdToNetwork,
    cryptoIdToNetworkAndContractAddress,
    cryptoIdToSymbol,
    filterQuotesAccordingTags,
    getDefaultCountry,
    getDefaultCountrySubdivision,
    getTradingFormState,
    getTradingPaymentMethods,
    getTradingQuotesByPaymentMethod,
    getUnusedAddressFromAccount,
    isCryptoIdForNativeToken,
    isFinalStatus,
    mapTestnetSymbol,
    testnetToProdCryptoId,
    toTokenCryptoId,
} from '../utils';

const sendAccountKey = 'send-account-key' as AccountKey;
const receiveAccountKey = 'receive-account-key' as AccountKey;

describe('getUnusedAddressFromAccount', () => {
    it('should return unused value from the passed account', () => {
        expect(getUnusedAddressFromAccount(accountBtc as Account)).toStrictEqual({
            address: '177BUDVZqTTzK1Fogqcrfbb5ketHEUDGSJ',
            path: "m/44'/0'/3'/0/0",
        });

        expect(getUnusedAddressFromAccount(accountEth as Account)).toStrictEqual({
            address: 'eth-descriptor',
            path: "m/44'/60'/0'/0/1",
        });
    });
});

describe('mapTestnetCryptoCurrency', () => {
    it.each([
        ['btc', 'btc'],
        ['eth', 'eth'],
        ['test', 'btc'],
        ['tsep', 'eth'],
        ['thod', 'eth'],
        ['txrp', 'xrp'],
        ['txlm', 'xlm'],
    ] as [NetworkSymbol, NetworkSymbol][])(
        'should transform testnet network symbol [%s] to mainnet',
        (symbol, expectedValue) => {
            expect(mapTestnetSymbol(symbol)).toStrictEqual(expectedValue);
        },
    );
});

describe('filterQuotesAccordingTags', () => {
    it('should filter quotes', () => {
        const quotes = [
            ...BUY_FIXTURE.MIN_MAX_QUOTES_OK,
            ...BUY_FIXTURE.ALTERNATIVE_QUOTES,
            ...SELL_FIXTURE.MIN_MAX_QUOTES_HIGH,
        ];

        expect(filterQuotesAccordingTags([])).toStrictEqual([]);
        expect(filterQuotesAccordingTags(quotes).length).toStrictEqual(
            quotes.filter(q => !q.tags || !q.tags.includes('alternativeCurrency')).length,
        );
    });
});

describe('addIdsToQuotes', () => {
    it('should add id to passed quotes according section', () => {
        const quotes = [...BUY_FIXTURE.MIN_MAX_QUOTES_OK];
        const quotesExchange = [...EXCHANGE_FIXTURE.MIN_MAX_QUOTES_OK];

        expect(addIdsToQuotes([], 'buy')).toStrictEqual([]);
        expect(addIdsToQuotes(undefined, 'buy')).toStrictEqual([]);

        const buyResult = addIdsToQuotes(quotes, 'buy');
        expect(buyResult.length).toStrictEqual(quotes.length);
        expect(
            buyResult.filter(q => q.orderId && 'paymentId' in q && q.paymentId).length,
        ).toStrictEqual(quotes.length);

        const exchangeResult = addIdsToQuotes(quotesExchange, 'exchange');
        expect(exchangeResult.length).toStrictEqual(quotesExchange.length);
        expect(exchangeResult.filter(q => q.orderId).length).toStrictEqual(quotesExchange.length);
    });
});

describe('testnetToProdCryptoId', () => {
    it('should convert testnet CryptoId to mainnet CryptoId', () => {
        expect(testnetToProdCryptoId('test-bitcoin' as CryptoId)).toEqual('bitcoin');
        expect(testnetToProdCryptoId('bitcoin' as CryptoId)).toEqual('bitcoin');

        expect(testnetToProdCryptoId('test-ripple' as CryptoId)).toEqual('ripple');
        expect(testnetToProdCryptoId('ripple' as CryptoId)).toEqual('ripple');

        expect(
            testnetToProdCryptoId(
                'test-ethereum--0x1234123412341234123412341234123412341236' as CryptoId,
            ),
        ).toEqual('ethereum--0x1234123412341234123412341234123412341236');
        expect(
            testnetToProdCryptoId(
                'ethereum--0x1234123412341234123412341234123412341236' as CryptoId,
            ),
        ).toEqual('ethereum--0x1234123412341234123412341234123412341236');
    });
});

describe('isCryptoIdForNativeToken', () => {
    it('should test if token is L2 native token', () => {
        expect(isCryptoIdForNativeToken('ethereum' as CryptoId)).toEqual(false);
        expect(
            isCryptoIdForNativeToken(
                'ethereum--0x1234123412341234123412341234123412341236' as CryptoId,
            ),
        ).toEqual(false);
        expect(
            isCryptoIdForNativeToken(
                'ethereum--0x0000000000000000000000000000000000000000' as CryptoId,
            ),
        ).toEqual(true);
        expect(
            isCryptoIdForNativeToken(
                'base--0x0000000000000000000000000000000000000000' as CryptoId,
            ),
        ).toEqual(true);
    });
});

describe('getTradingPaymentMethods', () => {
    const duplicateApplePayQuoteWithWorseAmount = {
        ...BUY_FIXTURE.MIN_MAX_QUOTES_OK[1],
        receiveStringAmount: '0.00000001',
    };
    const paymentMethods = getTradingPaymentMethods([
        ...BUY_FIXTURE.MIN_MAX_QUOTES_OK,
        duplicateApplePayQuoteWithWorseAmount, // duplicate applePay
    ]);

    it('should get payment methods from quotes', () => {
        const findApplePay = paymentMethods.find(
            paymentMethod =>
                paymentMethod.value === 'applePay' && paymentMethod.label === 'Apple Pay',
        );

        expect(paymentMethods.length).toBe(2);
        expect(findApplePay).toBeDefined();
    });

    it('should sort payment methods by receive amount in descending order', () => {
        const amounts = paymentMethods.map(method => new BigNumber(method.receiveAmount || '0'));
        const sortedAmounts = [...amounts].sort((a, b) => b.minus(a).toNumber());

        expect(amounts.map(amount => amount.toString())).toEqual(
            sortedAmounts.map(amount => amount.toString()),
        );
    });

    it('should keep first quote amount for duplicate payment method', () => {
        const applePayMethod = paymentMethods.find(method => method.value === 'applePay');

        expect(applePayMethod?.receiveAmount).toBe(
            BUY_FIXTURE.MIN_MAX_QUOTES_OK[1].receiveStringAmount,
        );
    });
});

describe('getTradingQuotesByPaymentMethod', () => {
    it('should select quotes according to payment method', () => {
        const quotes = getTradingQuotesByPaymentMethod(BUY_FIXTURE.MIN_MAX_QUOTES_OK, 'applePay');

        const allQuotesApplePay = quotes?.find(quote => quote.paymentMethod === 'applePay');

        expect(allQuotesApplePay).toBeDefined();
    });
});

describe('cryptoIdToSymbol', () => {
    it.each([
        ['bitcoin', 'btc'],
        ['ethereum', 'eth'],
        ['ethereum--0x1234123412341234123412341234123412341234', 'eth'],
    ] as [CryptoId, NetworkSymbol][])(
        'should return correct symbol for %s',
        (cryptoId, expectedSymbol) => {
            expect(cryptoIdToSymbol(cryptoId)).toBe(expectedSymbol);
        },
    );
});

describe('cryptoIdToNetworkAndContractAddress', () => {
    it.each([
        ['bitcoin', 'btc', undefined],
        ['ethereum', 'eth', undefined],
        [
            'ethereum--0x1234123412341234123412341234123412341234',
            'eth',
            '0x1234123412341234123412341234123412341234',
        ],
        [undefined, undefined, undefined],
    ] as [CryptoId | undefined, NetworkSymbol | undefined, string | undefined][])(
        'should return correct symbol and contract for %s',
        (cryptoId, expectedSymbol, expectedContract) => {
            expect(cryptoIdToNetworkAndContractAddress(cryptoId).network?.symbol).toBe(
                expectedSymbol,
            );
            expect(cryptoIdToNetworkAndContractAddress(cryptoId).contractAddress).toBe(
                expectedContract,
            );
        },
    );
});

describe('cryptoIdToNetwork', () => {
    it.each([
        ['bitcoin', 'btc'],
        ['ethereum', 'eth'],
        ['ethereum--0x1234123412341234123412341234123412341234', 'eth'],
    ] as [CryptoId, NetworkSymbol | undefined][])(
        'should return correct symbol for %s',
        (cryptoId, expectedSymbol) => {
            expect(cryptoIdToNetwork(cryptoId)?.symbol).toBe(expectedSymbol);
        },
    );
});

describe('toTokenCryptoId', () => {
    it('should return correct token cryptoId', () => {
        expect(toTokenCryptoId('eth', '0x1234123412341234123412341234123412341234')).toBe(
            'ethereum--0x1234123412341234123412341234123412341234',
        );
    });
});

describe('getDefaultCountry', () => {
    it('should return default country for unknown country', () => {
        expect(getDefaultCountry()).toEqual({
            codeAlpha3: 'unknown',
            flag: '🌍',
            label: '🌍 Worldwide',
            name: 'Worldwide',
            shortLabel: '🌍 Worldwide',
            value: 'unknown',
        });
    });

    it('should return correct value', () => {
        expect(getDefaultCountry('US')).toEqual({
            codeAlpha3: 'USA',
            flag: '🇺🇸',
            label: '🇺🇸 United States of America',
            name: 'United States of America',
            shortLabel: '🇺🇸 USA',
            value: 'US',
        });
    });

    it('should return default country for non existing code', () => {
        expect(getDefaultCountry('XX')).toEqual({
            codeAlpha3: 'unknown',
            flag: '🌍',
            label: '🌍 Worldwide',
            name: 'Worldwide',
            shortLabel: '🌍 Worldwide',
            value: 'unknown',
        });
    });
});

describe('getDefaultCountrySubdivision', () => {
    it('should return undefined when subdivision is undefined', () => {
        expect(getDefaultCountrySubdivision(undefined)).toBeUndefined();
    });

    it('should return undefined when subdivision code is not in the list', () => {
        expect(getDefaultCountrySubdivision('XX')).toBeUndefined();
    });

    it('should return correct option for a known subdivision code', () => {
        expect(getDefaultCountrySubdivision('CA')).toEqual({
            value: 'CA',
            label: 'California',
            name: 'California',
        });
    });

    it('should return correct option for a known subdivision code and country code', () => {
        expect(getDefaultCountrySubdivision('CA', 'US')).toEqual({
            value: 'CA',
            label: 'California',
            name: 'California',
        });
    });

    it('should return undefined when country does not require subdivision', () => {
        expect(getDefaultCountrySubdivision('CA', 'CZ')).toBeUndefined();
    });
});

describe('isFinalStatus', () => {
    it.each([
        ['buy', 'SUCCESS', true],
        ['buy', 'ERROR', true],
        ['buy', 'BLOCKED', true],
        ['buy', 'SUBMITTED', false],
        ['buy', 'WAITING_FOR_USER', false],
        ['buy', 'APPROVAL_PENDING', false],
        ['buy', undefined, false],
        ['sell', 'SUCCESS', true],
        ['sell', 'ERROR', true],
        ['sell', 'BLOCKED', true],
        ['sell', 'CANCELLED', true],
        ['sell', 'REFUNDED', true],
        ['sell', 'SEND_CRYPTO', false],
        ['sell', 'SUBMITTED', false],
        ['sell', undefined, false],
        ['exchange', 'SUCCESS', true],
        ['exchange', 'ERROR', true],
        ['exchange', 'KYC', true],
        ['exchange', 'CONVERTING', false],
        ['exchange', 'APPROVAL_PENDING', false],
        ['exchange', undefined, false],
    ])('should return %s for %s trade with %s status', (tradeType, status, expectedResult) => {
        expect(isFinalStatus(tradeType as any, status as any)).toBe(expectedResult);
    });
});

describe('getTradingFormState', () => {
    const mockProvider: ExchangeProviderInfo = {
        name: 'test-exchange',
        companyName: 'Test Exchange',
        logo: 'test.svg',
        isActive: true,
        isFixedRate: false,
        isDex: false,
        buyTickers: [],
        sellTickers: [],
        addressFormats: {},
        statusUrl: 'https://test.com/status',
        supportUrl: 'https://test.com/support',
        kycUrl: 'https://test.com/kyc',
        kycPolicy: 'No KYC required',
        kycPolicyType: 'noKYC',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sell section', () => {
        const activeSection: TradingSellType = 'sell';

        it('should return default state when required fields are missing', () => {
            const incompleteTrade = {
                exchange: 'test-exchange',
                isSlip24Active: false,
                // Missing required fields
            } as SellFiatTrade;

            const providers = {
                'test-exchange': mockProvider,
            };

            const result = getTradingFormState({
                activeSection,
                trade: incompleteTrade,
                providers,
                sendAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'sell',
                isSlip24Active: false,
            });
        });

        it('should return default state when provider is not found', () => {
            const trade = {
                exchange: 'unknown-exchange',
                fiatStringAmount: '1000',
                fiatCurrency: 'USD',
                cryptoCurrency: 'bitcoin' as CryptoId,
                cryptoStringAmount: '0.025',
            } as SellFiatTrade;

            const result = getTradingFormState({
                activeSection,
                trade,
                providers: {},
                sendAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'sell',
                isSlip24Active: false,
            });
        });

        it('should return default state when network is not found', () => {
            const trade = {
                exchange: 'test-exchange',
                fiatStringAmount: '1000',
                fiatCurrency: 'USD',
                cryptoCurrency: 'unknown-crypto' as CryptoId,
                cryptoStringAmount: '0.025',
            } as SellFiatTrade;

            const providers = {
                'test-exchange': mockProvider,
            };

            const result = getTradingFormState({
                activeSection,
                trade,
                providers,
                sendAccountKey,
                isSlip24Active: false,
            });

            expect(result).toEqual({
                activeSection: 'sell',
                isSlip24Active: false,
            });
        });

        it('should return complete form state for valid sell trade', () => {
            const trade = {
                exchange: 'test-exchange',
                fiatStringAmount: '1000',
                fiatCurrency: 'USD',
                cryptoCurrency: 'bitcoin' as CryptoId,
                cryptoStringAmount: '0.025',
            } as SellFiatTrade;

            const providers = {
                'test-exchange': mockProvider,
            };

            const result = getTradingFormState({
                activeSection,
                trade,
                providers,
                isSlip24Active: true,
                sendAccountKey,
                receiveAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'sell',
                isSlip24Active: true,
                recipientName: 'Test Exchange',
                send: {
                    accountKey: sendAccountKey,
                    cryptoId: 'bitcoin',
                    symbol: 'btc',
                    contractAddress: undefined,
                    amount: '0.025',
                },
                receive: {
                    amount: '1000',
                    fiatCurrency: 'USD',
                },
            });
        });

        it('should handle token trades with contract address', () => {
            const trade = {
                exchange: 'test-exchange',
                fiatStringAmount: '500',
                fiatCurrency: 'EUR',
                cryptoCurrency: 'ethereum--0x123456789' as CryptoId,
                cryptoStringAmount: '100',
            } as SellFiatTrade;

            const providers = {
                'test-exchange': mockProvider,
            };

            const result = getTradingFormState({
                activeSection,
                trade,
                providers,
                isSlip24Active: true,
                sendAccountKey,
                receiveAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'sell',
                recipientName: 'Test Exchange',
                isSlip24Active: true,
                send: {
                    accountKey: sendAccountKey,
                    symbol: 'eth',
                    contractAddress: '0x123456789',
                    amount: '100',
                    cryptoId: 'ethereum--0x123456789',
                },
                receive: {
                    amount: '500',
                    fiatCurrency: 'EUR',
                },
            });
        });
    });

    describe('exchange section', () => {
        const activeSection: TradingExchangeType = 'exchange';

        it('should return default state when required fields are missing', () => {
            const incompleteTrade = {
                exchange: 'test-exchange',
                // Missing required fields
            } as ExchangeTrade;

            const providers = {
                'test-exchange': mockProvider,
            };

            const result = getTradingFormState({
                activeSection,
                trade: incompleteTrade,
                providers,
                isSlip24Active: true,
                sendAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'exchange',
                isSlip24Active: true,
            });
        });

        it('should return default state when provider is not found', () => {
            const trade = {
                exchange: 'unknown-exchange',
                receive: 'ethereum' as CryptoId,
                receiveStringAmount: '1',
                send: 'bitcoin' as CryptoId,
                sendStringAmount: '0.025',
            } as ExchangeTrade;

            const result = getTradingFormState({
                activeSection,
                trade,
                providers: {},
                isSlip24Active: true,
                sendAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'exchange',
                isSlip24Active: true,
            });
        });

        it('should return default state when receive network is not found', () => {
            const trade = {
                exchange: 'test-exchange',
                receive: 'unknown-crypto' as CryptoId,
                receiveStringAmount: '1',
                send: 'bitcoin' as CryptoId,
                sendStringAmount: '0.025',
            } as ExchangeTrade;

            const providers = {
                'test-exchange': mockProvider,
            };

            const result = getTradingFormState({
                activeSection,
                trade,
                providers,
                isSlip24Active: true,
                sendAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'exchange',
                isSlip24Active: true,
            });
        });

        it('should return default state when send network is not found', () => {
            const trade = {
                exchange: 'test-exchange',
                receive: 'ethereum' as CryptoId,
                receiveStringAmount: '1',
                send: 'unknown-crypto' as CryptoId,
                sendStringAmount: '0.025',
            } as ExchangeTrade;

            const providers = {
                'test-exchange': mockProvider,
            };

            const result = getTradingFormState({
                activeSection,
                trade,
                providers,
                isSlip24Active: true,
                sendAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'exchange',
                isSlip24Active: true,
            });
        });

        it('should return complete form state for valid exchange trade', () => {
            const trade = {
                exchange: 'test-exchange',
                receive: 'ethereum' as CryptoId,
                receiveStringAmount: '1',
                send: 'bitcoin' as CryptoId,
                sendStringAmount: '0.025',
            } as ExchangeTrade;

            const providers = {
                'test-exchange': mockProvider,
            };

            const result = getTradingFormState({
                activeSection,
                trade,
                providers,
                isSlip24Active: true,
                sendAccountKey,
                receiveAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'exchange',
                recipientName: 'Test Exchange',
                isSlip24Active: true,
                send: {
                    accountKey: sendAccountKey,
                    cryptoId: 'bitcoin',
                    symbol: 'btc',
                    contractAddress: undefined,
                    amount: '0.025',
                },
                receive: {
                    accountKey: receiveAccountKey,
                    cryptoId: 'ethereum',
                    symbol: 'eth',
                    contractAddress: undefined,
                    amount: '1',
                },
            });
        });

        it('should handle token-to-token exchange with contract addresses', () => {
            const trade = {
                exchange: 'test-exchange',
                receive: 'ethereum--0xreceive123' as CryptoId,
                receiveStringAmount: '100',
                send: 'ethereum--0xsend456' as CryptoId,
                sendStringAmount: '50',
            } as ExchangeTrade;

            const providers = {
                'test-exchange': mockProvider,
            };

            const result = getTradingFormState({
                activeSection,
                trade,
                providers,
                isSlip24Active: true,
                sendAccountKey,
                receiveAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'exchange',
                recipientName: 'Test Exchange',
                isSlip24Active: true,
                send: {
                    accountKey: sendAccountKey,
                    cryptoId: 'ethereum--0xsend456',
                    symbol: 'eth',
                    contractAddress: '0xsend456',
                    amount: '50',
                },
                receive: {
                    accountKey: receiveAccountKey,
                    cryptoId: 'ethereum--0xreceive123',
                    symbol: 'eth',
                    contractAddress: '0xreceive123',
                    amount: '100',
                },
            });
        });
    });

    describe('edge cases', () => {
        it('should handle undefined providers', () => {
            const trade = {
                exchange: 'test-exchange',
                fiatStringAmount: '1000',
                fiatCurrency: 'USD',
                cryptoCurrency: 'bitcoin' as CryptoId,
                cryptoStringAmount: '0.025',
            } as SellFiatTrade;

            const result = getTradingFormState({
                activeSection: 'sell',
                trade,
                providers: undefined,
                isSlip24Active: true,
                sendAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'sell',
                isSlip24Active: true,
            });
        });

        it('should handle trade without exchange property', () => {
            const trade = {
                // exchange property missing
                fiatStringAmount: '1000',
                fiatCurrency: 'USD',
                cryptoCurrency: 'bitcoin' as CryptoId,
                cryptoStringAmount: '0.025',
            } as SellFiatTrade;

            const result = getTradingFormState({
                activeSection: 'sell',
                trade,
                providers: { 'test-exchange': mockProvider },
                isSlip24Active: true,
                sendAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'sell',
                isSlip24Active: true,
            });
        });

        it('should handle empty strings in trade amounts', () => {
            const trade = {
                exchange: 'test-exchange',
                fiatStringAmount: '',
                fiatCurrency: 'USD',
                cryptoCurrency: 'bitcoin' as CryptoId,
                cryptoStringAmount: '0.025',
            } as SellFiatTrade;

            const providers = {
                'test-exchange': mockProvider,
            };

            const result = getTradingFormState({
                activeSection: 'sell',
                trade,
                providers,
                isSlip24Active: true,
                sendAccountKey,
            });

            expect(result).toEqual({
                activeSection: 'sell',
                isSlip24Active: true,
            });
        });
    });
});
