import { yup } from '@suite-common/validators';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type TradingFormContext } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

export const getAmountLimitContext = ({
    options,
}: yup.TestContext<unknown>): Omit<TradingFormContext, 'currency'> & {
    currency: string;
} => {
    const context = options.context as TradingFormContext;

    return {
        ...context,
        currency: context.currency ?? 'unknown',
    };
};

export const formatCryptoAmount = (
    amount: string,
    currency: string,
    CryptoAmountFormatter: TradingFormContext['CryptoAmountFormatter'],
) =>
    CryptoAmountFormatter.format(amount, {
        symbol: currency.toLowerCase() as NetworkSymbol,
        isBalance: true,
    });

export const fiatAmountInputValidationSchema = yup
    .number()
    // This (untranslated) error will be hopefully never displayed to user,
    // but let's keep it here just to be safe
    .typeError('Invalid number')
    .min(0, 'Invalid value')
    .test('fiat-min', (value, testContext) => {
        const { currency, minFiat, translate, FiatAmountFormatter } =
            getAmountLimitContext(testContext);

        if (value === undefined || minFiat === undefined || value >= parseFloat(minFiat)) {
            return true;
        }

        return testContext.createError({
            message: translate('moduleTrading.validators.min', {
                min: FiatAmountFormatter.format(asBaseCurrencyAmount(new BigNumber(minFiat)), {
                    currency,
                }),
            }),
        });
    })
    .test('fiat-max', (value, testContext) => {
        const { currency, maxFiat, translate, FiatAmountFormatter } =
            getAmountLimitContext(testContext);

        if (value === undefined || maxFiat === undefined || value <= parseFloat(maxFiat)) {
            return true;
        }

        return testContext.createError({
            message: translate('moduleTrading.validators.max', {
                max: FiatAmountFormatter.format(asBaseCurrencyAmount(new BigNumber(maxFiat)), {
                    currency,
                }),
            }),
        });
    });

export const sendCryptoAmountValidationSchema = yup
    .number()
    // This (untranslated) error will be hopefully never displayed to user,
    // but let's keep it here just to be safe
    .typeError('Invalid number')
    .min(0, 'Invalid value')
    .test('send-crypto-min', (value, testContext) => {
        const { sendSymbol, minCrypto, translate, CryptoAmountFormatter, convertNumberToBaseUnit } =
            getAmountLimitContext(testContext);
        if (sendSymbol === undefined) {
            return true;
        }

        const convertedValue = convertNumberToBaseUnit(value, sendSymbol.toLowerCase());

        if (
            convertedValue === undefined ||
            minCrypto === undefined ||
            convertedValue >= parseFloat(minCrypto)
        ) {
            return true;
        }

        return testContext.createError({
            message: translate('moduleTrading.validators.min', {
                min: formatCryptoAmount(minCrypto, sendSymbol, CryptoAmountFormatter),
            }),
        });
    })
    .test('send-crypto-max', (value, testContext) => {
        const { sendSymbol, maxCrypto, translate, CryptoAmountFormatter, convertNumberToBaseUnit } =
            getAmountLimitContext(testContext);
        if (sendSymbol === undefined) {
            return true;
        }

        const convertedValue = convertNumberToBaseUnit(value, sendSymbol.toLowerCase());

        if (
            convertedValue === undefined ||
            maxCrypto === undefined ||
            convertedValue <= parseFloat(maxCrypto)
        ) {
            return true;
        }

        return testContext.createError({
            message: translate('moduleTrading.validators.max', {
                max: formatCryptoAmount(maxCrypto, sendSymbol, CryptoAmountFormatter),
            }),
        });
    })
    .test('send-crypto-balance', (value, testContext) => {
        const { balance, translate, convertNumberToBaseUnit, sendSymbol, maxSpendableAmount } =
            getAmountLimitContext(testContext);

        if (sendSymbol === undefined) {
            return true;
        }

        const convertedValue = convertNumberToBaseUnit(value, sendSymbol.toLowerCase());

        if (convertedValue === undefined || convertedValue === 0 || balance === undefined) {
            return true;
        }

        if (convertedValue > parseFloat(balance)) {
            return testContext.createError({
                type: 'insufficient-balance',
                message: translate('moduleTrading.validators.insufficientBalance'),
            });
        }

        if (maxSpendableAmount === undefined) {
            return testContext.createError({
                type: 'dust-limit',
                message: translate('moduleTrading.validators.dustLimit'),
            });
        }

        if (maxSpendableAmount && convertedValue > parseFloat(maxSpendableAmount)) {
            return testContext.createError({
                type: 'network-reserve',
                message: translate('moduleTrading.validators.networkReserve', {
                    displaySymbol: sendSymbol.toUpperCase(),
                }),
            });
        }

        return true;
    });
