import { type TranslationFunction, type TranslationKey } from '@suite/intl';
import { makeFormatter } from '@suite-common/formatters';

import { type AmountLimitProps, validateCryptoLimits } from '#src/utils/suite/validation';

import {
    TRADING_CRYPTO_LIMITS_RULE,
    TRADING_FIAT_MAX_RULE,
    TRADING_FIAT_MIN_RULE,
} from './TradingFormInput/TradingFormInputFiatCrypto/tradingFormInputFiatCryptoRules';
import { getTradingAmountLimit } from './tradingAmountLimitUtils';

type Params = Parameters<typeof getTradingAmountLimit>[0];

type ValidatorAgreementCase = {
    name: string;
    cryptoAmount: string;
    amountLimits: AmountLimitProps;
    isInSats: boolean;
};

const VALIDATOR_MESSAGE_LIMITS = new Map<TranslationKey, 'min' | 'max'>([
    ['TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO', 'min'],
    ['TR_BUY_VALIDATION_ERROR_MAXIMUM_CRYPTO', 'max'],
]);

const translateToLimit: TranslationFunction = id => VALIDATOR_MESSAGE_LIMITS.get(id) ?? '';
const formatter = makeFormatter<string, string>(value => value);

const cryptoParams: Params = {
    errorType: TRADING_CRYPTO_LIMITS_RULE,
    cryptoAmount: '1',
    amountLimits: { currency: 'ZEC' },
    isInSats: false,
    cryptoDecimals: 8,
};

describe(getTradingAmountLimit.name, () => {
    it('returns nothing without amount limits', () => {
        expect(getTradingAmountLimit({ ...cryptoParams, amountLimits: undefined })).toBeUndefined();
    });

    describe('crypto', () => {
        it('returns the minimum for an amount below it', () => {
            expect(
                getTradingAmountLimit({
                    ...cryptoParams,
                    cryptoAmount: '0.00453844',
                    amountLimits: { currency: 'ZEC', minCrypto: '0.02208' },
                }),
            ).toEqual({ limit: 'min', amountType: 'crypto', amount: '0.02208' });
        });

        it('returns the maximum for an amount above it', () => {
            expect(
                getTradingAmountLimit({
                    ...cryptoParams,
                    cryptoAmount: '50',
                    amountLimits: { currency: 'ZEC', maxCrypto: '10' },
                }),
            ).toEqual({ limit: 'max', amountType: 'crypto', amount: '10' });
        });
    });

    describe('fiat', () => {
        const fiatParams: Params = {
            ...cryptoParams,
            cryptoAmount: undefined,
            amountLimits: { currency: 'BTC', minFiat: '25.123', maxFiat: '1000.999' },
        };

        it('returns the minimum rounded up to cents', () => {
            expect(
                getTradingAmountLimit({ ...fiatParams, errorType: TRADING_FIAT_MIN_RULE }),
            ).toEqual({ limit: 'min', amountType: 'fiat', amount: '25.13' });
        });

        it('returns the maximum rounded down to cents', () => {
            expect(
                getTradingAmountLimit({ ...fiatParams, errorType: TRADING_FIAT_MAX_RULE }),
            ).toEqual({ limit: 'max', amountType: 'fiat', amount: '1000.99' });
        });

        it('returns nothing when the reported limit is unknown', () => {
            expect(
                getTradingAmountLimit({
                    ...fiatParams,
                    errorType: TRADING_FIAT_MIN_RULE,
                    amountLimits: { currency: 'BTC' },
                }),
            ).toBeUndefined();
        });
    });

    describe('agreement with the crypto limits validator', () => {
        it.each<ValidatorAgreementCase>([
            {
                name: 'an amount below the minimum',
                cryptoAmount: '0.001',
                amountLimits: { currency: 'BTC', minCrypto: '0.002' },
                isInSats: false,
            },
            {
                name: 'an amount above the maximum',
                cryptoAmount: '50',
                amountLimits: { currency: 'BTC', maxCrypto: '10' },
                isInSats: false,
            },
            {
                name: 'an amount above the maximum with a zero minimum',
                cryptoAmount: '50',
                amountLimits: { currency: 'BTC', minCrypto: '0', maxCrypto: '10' },
                isInSats: false,
            },
            {
                name: 'an amount above the maximum with a known minimum',
                cryptoAmount: '50',
                amountLimits: { currency: 'BTC', minCrypto: '0.002', maxCrypto: '10' },
                isInSats: false,
            },
            {
                name: 'an amount just under a minimum finer than the field',
                cryptoAmount: '0.12345678',
                amountLimits: { currency: 'BTC', minCrypto: '0.123456781' },
                isInSats: false,
            },
            {
                name: 'an amount just over a maximum finer than the field',
                cryptoAmount: '10.12345679',
                amountLimits: { currency: 'BTC', maxCrypto: '10.123456789' },
                isInSats: false,
            },
            {
                name: 'sats below the minimum',
                cryptoAmount: '5000',
                amountLimits: { currency: 'BTC', minCrypto: '0.0001' },
                isInSats: true,
            },
            {
                name: 'sats within the maximum',
                cryptoAmount: '500000000',
                amountLimits: { currency: 'BTC', maxCrypto: '10' },
                isInSats: true,
            },
        ])('offers the limit the validator reports for $name', testCase => {
            const { cryptoAmount, amountLimits, isInSats } = testCase;
            const reportedLimit = validateCryptoLimits(translateToLimit, {
                amountLimits,
                areSatsUsed: isInSats,
                formatter,
            })(cryptoAmount);

            const offeredLimit = getTradingAmountLimit({
                ...cryptoParams,
                cryptoAmount,
                amountLimits,
                isInSats,
            });

            expect(offeredLimit?.limit).toBe(reportedLimit || undefined);
        });
    });
});
