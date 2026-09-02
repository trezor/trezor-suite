import { yup } from '@suite-common/validators';
import {
    type NetworkSymbol,
    getNetworkDisplaySymbol,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { type TokenSymbol, asBaseCurrencyAmount } from '@suite-common/wallet-types';
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

type FormatCryptoAmountParams = Pick<
    TradingFormContext,
    'contractAddress' | 'CryptoAmountFormatter'
> & {
    amount: string;
    symbol: string;
};

export const formatCryptoAmount = ({
    amount,
    symbol,
    contractAddress,
    CryptoAmountFormatter,
}: FormatCryptoAmountParams) =>
    CryptoAmountFormatter.format(amount, {
        symbol:
            !contractAddress && isNetworkSymbol(symbol.toLowerCase())
                ? (symbol.toLowerCase() as NetworkSymbol)
                : (symbol as NetworkSymbol | TokenSymbol),
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
        const {
            sendAssetSymbol,
            minCrypto,
            translate,
            CryptoAmountFormatter,
            convertNumberToBaseUnit,
            sendNetworkSymbol,
            contractAddress,
        } = getAmountLimitContext(testContext);
        if (sendAssetSymbol === undefined || sendNetworkSymbol === undefined) {
            return true;
        }

        const convertedValue = convertNumberToBaseUnit(value, sendNetworkSymbol);

        if (
            convertedValue === undefined ||
            minCrypto === undefined ||
            convertedValue >= parseFloat(minCrypto)
        ) {
            return true;
        }

        return testContext.createError({
            message: translate('moduleTrading.validators.min', {
                min: formatCryptoAmount({
                    amount: minCrypto,
                    symbol: sendAssetSymbol,
                    contractAddress,
                    CryptoAmountFormatter,
                }),
            }),
        });
    })
    .test('send-crypto-max', (value, testContext) => {
        const {
            sendAssetSymbol,
            maxCrypto,
            translate,
            CryptoAmountFormatter,
            convertNumberToBaseUnit,
            sendNetworkSymbol,
            contractAddress,
        } = getAmountLimitContext(testContext);
        if (sendAssetSymbol === undefined || sendNetworkSymbol === undefined) {
            return true;
        }

        const convertedValue = convertNumberToBaseUnit(value, sendNetworkSymbol);

        if (
            convertedValue === undefined ||
            maxCrypto === undefined ||
            convertedValue <= parseFloat(maxCrypto)
        ) {
            return true;
        }

        return testContext.createError({
            message: translate('moduleTrading.validators.max', {
                max: formatCryptoAmount({
                    amount: maxCrypto,
                    symbol: sendAssetSymbol,
                    contractAddress,
                    CryptoAmountFormatter,
                }),
            }),
        });
    })
    .test('send-crypto-balance', (value, testContext) => {
        const {
            balance,
            translate,
            convertNumberToBaseUnit,
            sendAssetSymbol,
            sendNetworkSymbol,
            maxSpendableAmount,
        } = getAmountLimitContext(testContext);

        if (sendAssetSymbol === undefined || sendNetworkSymbol === undefined) {
            return true;
        }

        const convertedValue = convertNumberToBaseUnit(value, sendNetworkSymbol);

        if (convertedValue === undefined || convertedValue === 0 || balance === undefined) {
            return true;
        }

        if (convertedValue > parseFloat(balance)) {
            return testContext.createError({
                type: 'insufficient-balance',
                message: translate('moduleTrading.validators.insufficientBalance'),
            });
        }

        // undefined means the max amount is unknown (still loading or its calculation
        // failed), there is nothing to validate against
        if (maxSpendableAmount === undefined) {
            return true;
        }

        if (convertedValue > parseFloat(maxSpendableAmount)) {
            return testContext.createError({
                type: 'network-reserve',
                message: translate('moduleTrading.validators.networkReserve', {
                    displaySymbol: getNetworkDisplaySymbol(sendNetworkSymbol),
                }),
            });
        }

        return true;
    });
