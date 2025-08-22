import { yup } from '@suite-common/validators';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { ExchangeFormContext } from '../../types/exchange';

const getAmountLimitContext = ({
    options,
}: yup.TestContext<unknown>): Omit<ExchangeFormContext, 'currency'> & {
    currency: string;
} => {
    const context = options.context as ExchangeFormContext;

    return {
        ...context,
        currency: context.currency ?? 'unknown',
    };
};

const formatCryptoAmount = (
    amount: string,
    currency: string,
    CryptoAmountFormatter: ExchangeFormContext['CryptoAmountFormatter'],
) =>
    CryptoAmountFormatter.format(amount, {
        symbol: currency.toLowerCase() as NetworkSymbol,
        isBalance: true,
    });

export const exchangeFormValidationSchema = yup.object({
    sendCryptoAmount: yup
        .number()
        // This (untranslated) error will be hopefully never displayed to user,
        // but let's keep it here just to be safe
        .typeError('Invalid number')
        .min(0, 'Invalid value')
        .test('send-crypto-min', (value, testContext) => {
            const {
                currency,
                minCrypto,
                translate,
                CryptoAmountFormatter,
                convertNumberToBaseUnit,
            } = getAmountLimitContext(testContext);
            const convertedValue = convertNumberToBaseUnit(value, currency.toLowerCase());

            if (
                convertedValue === undefined ||
                minCrypto === undefined ||
                convertedValue >= parseFloat(minCrypto)
            ) {
                return true;
            }

            return testContext.createError({
                message: translate('moduleTrading.validators.min', {
                    min: formatCryptoAmount(minCrypto, currency, CryptoAmountFormatter),
                }),
            });
        })
        .test('send-crypto-max', (value, testContext) => {
            const {
                currency,
                maxCrypto,
                translate,
                CryptoAmountFormatter,
                convertNumberToBaseUnit,
            } = getAmountLimitContext(testContext);
            const convertedValue = convertNumberToBaseUnit(value, currency.toLowerCase());

            if (
                convertedValue === undefined ||
                maxCrypto === undefined ||
                convertedValue <= parseFloat(maxCrypto)
            ) {
                return true;
            }

            return testContext.createError({
                message: translate('moduleTrading.validators.max', {
                    max: formatCryptoAmount(maxCrypto, currency, CryptoAmountFormatter),
                }),
            });
        })
        .test('send-crypto-balance', (value, testContext) => {
            const { balance, translate, convertNumberToBaseUnit, currency } =
                getAmountLimitContext(testContext);
            const convertedValue = convertNumberToBaseUnit(value, currency.toLowerCase());

            if (
                convertedValue === undefined ||
                balance === undefined ||
                convertedValue <= parseFloat(balance)
            ) {
                return true;
            }

            return testContext.createError({
                message: translate('moduleTrading.validators.insufficientBalance'),
            });
        }),
});
