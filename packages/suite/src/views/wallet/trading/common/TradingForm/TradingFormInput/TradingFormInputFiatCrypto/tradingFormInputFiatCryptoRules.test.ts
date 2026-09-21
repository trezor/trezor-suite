import { type TranslationFunction } from '@suite/intl';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { getFiatInputRules } from './tradingFormInputFiatCryptoRules';

const t = ((key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key) as TranslationFunction;

type Props = Parameters<typeof getFiatInputRules>[0];
type Validator = (value: string) => string | undefined;
type ValidateMap = Record<'min' | 'decimals' | 'minFiat' | 'maxFiat', Validator>;

const baseProps: Props = {
    translationString: t,
    amountLimits: undefined,
    selectedCurrencyCode: 'usd' as BaseCurrencyCode,
};

const getValidators = (props: Props) =>
    (getFiatInputRules(props) as { validate: ValidateMap }).validate;

describe('getFiatInputRules', () => {
    it('validates the amount limits and the currency decimals only', () => {
        const validate = getValidators(baseProps);

        expect(Object.keys(validate)).toEqual(['min', 'decimals', 'minFiat', 'maxFiat']);
    });

    describe('minFiat', () => {
        const propsWithLimits = {
            ...baseProps,
            amountLimits: { currency: 'USD', minFiat: '10', maxFiat: '1000' },
        };

        it('returns undefined when value is empty', () => {
            const { minFiat } = getValidators(propsWithLimits);
            expect(minFiat('')).toBeUndefined();
        });

        it('returns undefined when amountLimits.minFiat is not set', () => {
            const { minFiat } = getValidators({ ...baseProps, amountLimits: { currency: 'USD' } });
            expect(minFiat('1')).toBeUndefined();
        });

        it('returns undefined when value >= minFiat', () => {
            const { minFiat } = getValidators(propsWithLimits);
            expect(minFiat('10')).toBeUndefined();
            expect(minFiat('50')).toBeUndefined();
        });

        it('returns error when value < minFiat', () => {
            const { minFiat } = getValidators(propsWithLimits);
            expect(minFiat('9.99')).toBe(
                'TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT:{"minimum":"10.00","currency":"USD"}',
            );
        });
    });

    describe('maxFiat', () => {
        const propsWithLimits = {
            ...baseProps,
            amountLimits: { currency: 'USD', minFiat: '10', maxFiat: '1000' },
        };

        it('returns undefined when value is empty', () => {
            const { maxFiat } = getValidators(propsWithLimits);
            expect(maxFiat('')).toBeUndefined();
        });

        it('returns undefined when amountLimits.maxFiat is not set', () => {
            const { maxFiat } = getValidators({ ...baseProps, amountLimits: { currency: 'USD' } });
            expect(maxFiat('99999')).toBeUndefined();
        });

        it('returns undefined when value <= maxFiat', () => {
            const { maxFiat } = getValidators(propsWithLimits);
            expect(maxFiat('1000')).toBeUndefined();
            expect(maxFiat('500')).toBeUndefined();
        });

        it('returns error when value > maxFiat', () => {
            const { maxFiat } = getValidators(propsWithLimits);
            expect(maxFiat('1000.01')).toBe(
                'TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT:{"maximum":"1000.00","currency":"USD"}',
            );
        });
    });
});
