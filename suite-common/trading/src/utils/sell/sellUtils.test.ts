import { type CryptoId, type SellFiatTrade, type SellProviderInfo } from 'invity-api';

import { sellUtilsFixtures } from './__fixtures__/sellUtils';
import { sellUtils } from './sellUtils';
import { mockBankAccount } from '../../../mocks/mockBankAccount';
import { mockSellFiatTrade } from '../../../mocks/mockSellFiatTrade';
import { type TradingSellInfoSelector } from '../../selectors/tradingSelectors';

describe('sellUtils', () => {
    describe('getAmountLimits', () => {
        const currency = 'bitcoin';

        it.each([
            [
                'should return undefined when found at least one correct quote for sending request in fiat',
                sellUtilsFixtures.QUOTE_REQUEST_FIAT,
                sellUtilsFixtures.MIN_MAX_QUOTES_OK,
                undefined,
            ],
            [
                'should return undefined when found at least one correct quote for sending request in crypto',
                sellUtilsFixtures.QUOTE_REQUEST_CRYPTO,
                sellUtilsFixtures.MIN_MAX_QUOTES_OK,
                undefined,
            ],
            [
                'should return amountLimits with minCrypto when all quotes are below minimum for sending request in fiat',
                sellUtilsFixtures.QUOTE_REQUEST_FIAT,
                sellUtilsFixtures.MIN_MAX_QUOTES_LOW,
                {
                    currency: 'EUR',
                    minFiat: '20',
                },
            ],
            [
                'should return amountLimits with minCrypto when all quotes are below minimum for sending request in crypto',
                sellUtilsFixtures.QUOTE_REQUEST_CRYPTO,
                sellUtilsFixtures.MIN_MAX_QUOTES_LOW,
                {
                    currency: 'bitcoin',
                    minCrypto: '0.002',
                },
            ],
            [
                'should return amountLimits with maxCrypto when all quotes are above maximum for sending request in fiat',
                sellUtilsFixtures.QUOTE_REQUEST_FIAT,
                sellUtilsFixtures.MIN_MAX_QUOTES_HIGH,
                {
                    currency: 'EUR',
                    maxFiat: '17045',
                },
            ],
            [
                'should return amountLimits with maxCrypto when all quotes are above maximum for sending request in crypto',
                sellUtilsFixtures.QUOTE_REQUEST_CRYPTO,
                sellUtilsFixtures.MIN_MAX_QUOTES_HIGH,
                {
                    currency: 'bitcoin',
                    maxCrypto: '1.67212968',
                },
            ],
        ])('%s', (_m, request, quotes, expectedResult) => {
            const amountLimits = sellUtils.getAmountLimits({ request, quotes, currency });

            expect(amountLimits).toStrictEqual(expectedResult);
        });
    });

    describe('formatIban', () => {
        it('should stay stable', () => {
            expect(sellUtils.formatIban('SE35 5000 0000 0549 1000 0003')).toEqual(
                'SE35 5000 0000 0549 1000 0003',
            );
        });

        it('should format correctly', () => {
            expect(sellUtils.formatIban('CH9300762011623852957')).toEqual(
                'CH93 0076 2011 6238 5295 7',
            );
        });
    });

    describe('getStatusMessage', () => {
        it.each([
            ['PENDING' as const, 'TR_SELL_STATUS_PENDING'],
            ['SUBMITTED' as const, 'TR_SELL_STATUS_PENDING'],
            ['ERROR' as const, 'TR_SELL_STATUS_ERROR'],
            ['BLOCKED' as const, 'TR_SELL_STATUS_ERROR'],
            ['CANCELLED' as const, 'TR_SELL_STATUS_ERROR'],
            ['REFUNDED' as const, 'TR_SELL_STATUS_ERROR'],
            ['SUCCESS' as const, 'TR_SELL_STATUS_SUCCESS'],
            ['LOGIN_REQUEST' as const, 'TR_SELL_STATUS_PENDING'],
            ['SITE_ACTION_REQUEST' as const, 'TR_SELL_STATUS_PENDING'],
        ])('should return %s for %s', (status, expected) => {
            expect(sellUtils.getStatusMessage(status)).toBe(expected);
        });
    });

    describe('needToRegisterOrVerifyBankAccount', () => {
        const bankAccountProvider: SellProviderInfo = {
            name: 'test',
            companyName: 'Test',
            logo: 'test.jpg',
            isActive: true,
            statusUrl: 'https://test.io/sell/txs/{{orderId}}',
            supportUrl: 'https://support.test.io',
            tradedCoins: ['bitcoin' as CryptoId],
            tradedFiatCurrencies: ['CZK', 'USD'],
            type: 'Fiat',
            supportedCountries: ['CZ'],
            flow: 'BANK_ACCOUNT',
            supportedSubdivisions: {},
        };
        const sellInfo: TradingSellInfoSelector = {
            providerInfos: { test: bankAccountProvider },
            supportedFiatCurrencies: new Set(),
            supportedCryptoCurrencies: new Set(),
            country: 'CZ',
        };

        const quote: SellFiatTrade = {
            ...sellUtilsFixtures.MIN_MAX_QUOTES_OK[0],
            exchange: 'test',
            orderId: 'orderId',
            cryptoStringAmount: '0.01',
            destinationAddress: 'destinationAddress',
            destinationPaymentExtraId: 'extraId',
        };

        it('should return false when is not match between exchange and quote', () => {
            expect(
                sellUtils.needToRegisterOrVerifyBankAccount({
                    sellInfo,
                    quote: {
                        ...quote,
                        exchange: 'test-different',
                    },
                }),
            ).toBe(false);
        });

        it('should return false when quote exchange is undefined', () => {
            expect(
                sellUtils.needToRegisterOrVerifyBankAccount({
                    sellInfo,
                    quote: {
                        ...quote,
                        exchange: undefined,
                    },
                }),
            ).toBe(false);
        });

        it('should return false when provider flow is not not BANK_ACCOUNT', () => {
            const testProvider = sellInfo.providerInfos['test'];
            if (!testProvider) throw new Error('Missing test fixture');
            expect(
                sellUtils.needToRegisterOrVerifyBankAccount({
                    sellInfo: {
                        ...sellInfo,
                        providerInfos: {
                            test: { ...testProvider, flow: 'PAYMENT_GATE' },
                        },
                    },
                    quote,
                }),
            ).toBe(false);
        });

        it('should return false when quoteId is not defined', () => {
            expect(
                sellUtils.needToRegisterOrVerifyBankAccount({
                    sellInfo,
                    quote: {
                        ...quote,
                        quoteId: undefined,
                    },
                }),
            ).toBe(false);
        });

        it('should return false when there are some verified bank accounts', () => {
            expect(
                sellUtils.needToRegisterOrVerifyBankAccount({
                    sellInfo,
                    quote: {
                        ...quote,
                        bankAccounts: [mockBankAccount()],
                    },
                }),
            ).toBe(false);
        });

        it('should return true when there are not any bank accounts', () => {
            expect(
                sellUtils.needToRegisterOrVerifyBankAccount({
                    sellInfo,
                    quote: {
                        ...quote,
                        bankAccounts: undefined,
                    },
                }),
            ).toBe(true);
        });

        it('should return true when account is verified', () => {
            expect(
                sellUtils.needToRegisterOrVerifyBankAccount({
                    sellInfo,
                    quote: {
                        ...quote,
                        bankAccounts: [mockBankAccount({ verified: false })],
                    },
                }),
            ).toBe(true);
        });

        describe('getStepForQuote', () => {
            const verifiedBankAccount = mockBankAccount();

            it('opens the bank account step when the bank account provider knows a verified account', () => {
                expect(
                    sellUtils.getStepForQuote({
                        sellInfo,
                        quote: { ...quote, bankAccounts: [verifiedBankAccount] },
                    }),
                ).toBe('BANK_ACCOUNT');
            });

            it.each([
                [
                    'the partner requests a login first',
                    { ...quote, quoteId: undefined, bankAccounts: [verifiedBankAccount] },
                ],
                [
                    'no bank account is verified',
                    { ...quote, bankAccounts: [{ ...verifiedBankAccount, verified: false }] },
                ],
                ['there are no bank accounts', { ...quote, bankAccounts: undefined }],
            ])('opens the preview when %s', (_, stepQuote) => {
                expect(sellUtils.getStepForQuote({ sellInfo, quote: stepQuote })).toBe('PREVIEW');
            });

            it('opens the preview for a payment gate provider', () => {
                expect(
                    sellUtils.getStepForQuote({
                        sellInfo: {
                            ...sellInfo,
                            providerInfos: {
                                test: { ...bankAccountProvider, flow: 'PAYMENT_GATE' },
                            },
                        },
                        quote: { ...quote, bankAccounts: [verifiedBankAccount] },
                    }),
                ).toBe('PREVIEW');
            });
        });
    });

    describe('findSelectedBankAccount', () => {
        const unverified = mockBankAccount({ bankAccount: 'LT1', verified: false });
        const verified = mockBankAccount({ bankAccount: 'LT2' });
        const otherVerified = mockBankAccount({ bankAccount: 'LT3' });

        it.each([
            ['the picked account while the partner still lists it', 'LT3', otherVerified],
            ['the first verified account without a pick', undefined, verified],
            ['the first verified account when the pick is no longer listed', 'LT9', verified],
        ])('selects %s', (_, selectedIban, expected) => {
            expect(
                sellUtils.findSelectedBankAccount(
                    [unverified, verified, otherVerified],
                    selectedIban,
                ),
            ).toBe(expected);
        });

        it.each([
            ['no account is verified', [unverified]],
            ['there are no accounts', []],
            ['the partner sent no accounts', undefined],
        ])('selects nothing when %s', (_, bankAccounts) => {
            expect(sellUtils.findSelectedBankAccount(bankAccounts, undefined)).toBeUndefined();
        });
    });

    describe('isReadyToSendCrypto', () => {
        const trade = mockSellFiatTrade({
            status: 'SEND_CRYPTO',
            destinationAddress: 'destinationAddress',
        });

        it('is ready once the partner sent its payin address', () => {
            expect(sellUtils.isReadyToSendCrypto(trade)).toBe(true);
        });

        it.each([
            ['the partner has not requested the crypto yet', { ...trade, status: 'SUBMITTED' }],
            ['the payin address is missing', { ...trade, destinationAddress: undefined }],
        ] as const)('is not ready when %s', (_, notReadyTrade) => {
            expect(sellUtils.isReadyToSendCrypto(notReadyTrade)).toBe(false);
        });
    });
});
