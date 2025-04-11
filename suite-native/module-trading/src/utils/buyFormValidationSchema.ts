import { yup } from '@suite-common/validators';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { TradingBuyFormContext } from '../types';

const getAmountLimitContext = ({ options }: yup.TestContext<unknown>) =>
    options.context as TradingBuyFormContext;

const formatCryptoAmount = (
    amount: string,
    currency: string,
    CryptoAmountFormatter: TradingBuyFormContext['CryptoAmountFormatter'],
) =>
    CryptoAmountFormatter.format(amount, {
        symbol: currency.toLowerCase() as NetworkSymbol,
        isBalance: true,
    });

export const buyFormValidationSchema = yup.object({
    cryptoValue: yup
        .number()
        // This (untranslated) error will be hopefully never displayed to user,
        // but let's keep it here just to be safe
        .typeError('Invalid number')
        .positive()
        .test('crypto-min', (value, testContext) => {
            const { currency, minCrypto, translate, CryptoAmountFormatter } =
                getAmountLimitContext(testContext);

            if (value === undefined || minCrypto === undefined || value >= parseFloat(minCrypto)) {
                return true;
            }

            return testContext.createError({
                message: translate('moduleTrading.validators.min', {
                    min: formatCryptoAmount(minCrypto, currency, CryptoAmountFormatter),
                }),
            });
        })
        .test('crypto-max', (value, testContext) => {
            const { currency, maxCrypto, translate, CryptoAmountFormatter } =
                getAmountLimitContext(testContext);

            if (value === undefined || maxCrypto === undefined || value <= parseFloat(maxCrypto)) {
                return true;
            }

            return testContext.createError({
                message: translate('moduleTrading.validators.max', {
                    max: formatCryptoAmount(maxCrypto, currency, CryptoAmountFormatter),
                }),
            });
        }),
    fiatValue: yup
        .number()
        // This (untranslated) error will be hopefully never displayed to user,
        // but let's keep it here just to be safe
        .typeError('Invalid number')
        .positive()
        .test('fiat-min', (value, testContext) => {
            const { currency, minFiat, translate, FiatAmountFormatter } =
                getAmountLimitContext(testContext);

            if (value === undefined || minFiat === undefined || value >= parseFloat(minFiat)) {
                return true;
            }

            return testContext.createError({
                message: translate('moduleTrading.validators.min', {
                    min: FiatAmountFormatter.format(minFiat, { currency }),
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
                    max: FiatAmountFormatter.format(maxFiat, { currency }),
                }),
            });
        }),
});
