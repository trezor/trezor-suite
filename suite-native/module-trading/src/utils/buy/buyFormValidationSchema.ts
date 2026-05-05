import { yup } from '@suite-common/validators';

import {
    fiatAmountInputValidationSchema,
    formatCryptoAmount,
    getAmountLimitContext,
} from '../general/validationSchemes';

export const CRYPTO_MAX_FORM_TYPE = 'crypto-max';
export const CRYPTO_MIN_FORM_TYPE = 'crypto-min';

export const buyFormValidationSchema = yup.object({
    cryptoValue: yup
        .number()
        // This (untranslated) error will be hopefully never displayed to user,
        // but let's keep it here just to be safe
        .typeError('Invalid number')
        .min(0, 'Invalid value')
        .test(CRYPTO_MIN_FORM_TYPE, (value, testContext) => {
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
        .test(CRYPTO_MAX_FORM_TYPE, (value, testContext) => {
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
        }),
    fiatValue: fiatAmountInputValidationSchema,
});
