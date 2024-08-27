import { selectAccounts, selectDevice } from '@suite-common/wallet-core';
import {
    amountToSatoshi,
    formatAmount,
    fromFiatCurrency,
    isEthereumAccountSymbol,
    isZero,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';
import { FiatCurrencyCode } from 'invity-api';
import { useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
    FORM_CRYPTO_TOKEN,
    FORM_OUTPUT_ADDRESS,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_CURRENCY,
    FORM_OUTPUT_FIAT,
    FORM_OUTPUT_MAX,
    FORM_SEND_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/coinmarket/form';
import { useSelector } from 'src/hooks/suite';
import { useCoinmarketFiatValues } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketFiatValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { CoinmarketAccountOptionsGroupOptionProps } from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketSellExchangeFormProps,
    CoinmarketUseFormActionsProps,
    CoinmarketUseFormActionsReturnProps,
} from 'src/types/coinmarket/coinmarketForm';
import { coinmarketGetSortedAccounts } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    cryptoToNetworkSymbol,
    getNetworkDecimals,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';

/**
 * shareable sub-hook used in useCoinmarketSellForm & useCoinmarketExchangeForm
 * @return functions and values to handle form inputs and update fee levels
 */
export const useCoinmarketFormActions = <T extends CoinmarketSellExchangeFormProps>({
    account,
    methods,
    setAmountLimits,
    changeFeeLevel,
    composeRequest,
    setAccountOnChange,
}: CoinmarketUseFormActionsProps<T>): CoinmarketUseFormActionsReturnProps => {
    const { symbol } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectDevice);
    const accountsSorted = coinmarketGetSortedAccounts({
        accounts,
        deviceState: device?.state,
    });

    const { getValues, setValue, clearErrors } =
        methods as unknown as UseFormReturn<CoinmarketSellExchangeFormProps>;
    const { outputs, sendCryptoSelect } = getValues();
    const tokenAddress = outputs?.[0]?.token;
    const tokenData = account.tokens?.find(t => t.contract === tokenAddress);
    const isBalanceZero = tokenData
        ? isZero(tokenData.balance || '0')
        : isZero(account.formattedBalance);
    const coinmarketFiatValues = useCoinmarketFiatValues({
        accountBalance: account.formattedBalance,
        cryptoSymbol: sendCryptoSelect?.value,
        tokenAddress,
        fiatCurrency: getValues().outputs?.[0]?.currency?.value as FiatCurrencyCode,
    });
    const networkDecimals = getNetworkDecimals(coinmarketFiatValues?.networkDecimals);

    const onFiatCurrencyChange = useCallback(
        async (value: FiatCurrencyCode) => {
            if (!coinmarketFiatValues) return;

            const rate = await coinmarketFiatValues.fiatRatesUpdater(value);
            const amount = getValues(FORM_OUTPUT_AMOUNT);
            const formattedAmount = new BigNumber(
                shouldSendInSats ? formatAmount(amount, networkDecimals) : amount,
            );

            if (
                rate?.rate &&
                formattedAmount &&
                !formattedAmount.isNaN() &&
                formattedAmount.gt(0) // formatAmount() returns '-1' on error
            ) {
                const fiatValueBigNumber = formattedAmount.multipliedBy(rate.rate);

                setValue(FORM_OUTPUT_FIAT, fiatValueBigNumber.toFixed(2), {
                    shouldValidate: true,
                });
            }
        },
        [coinmarketFiatValues, networkDecimals, shouldSendInSats, getValues, setValue],
    );

    // watch change in fiat amount and recalculate fees on change
    const calculateCryptoAmountFromFiat = useCallback(
        (fiatAmount: string | undefined) => {
            const fiatCurrency = getValues(FORM_OUTPUT_CURRENCY);

            if (!coinmarketFiatValues || !fiatCurrency || !fiatAmount) {
                // setValue(FORM_OUTPUT_AMOUNT, '0', { shouldValidate: true });

                return;
            }

            console.log(coinmarketFiatValues);
            const cryptoAmount = fromFiatCurrency(
                fiatAmount,
                networkDecimals,
                coinmarketFiatValues.fiatRate?.rate,
            );

            const formattedCryptoAmount =
                cryptoAmount && shouldSendInSats
                    ? amountToSatoshi(cryptoAmount, networkDecimals)
                    : cryptoAmount ?? '';
            setValue(FORM_OUTPUT_AMOUNT, formattedCryptoAmount, { shouldValidate: true });
        },
        [getValues, coinmarketFiatValues, networkDecimals, shouldSendInSats, setValue],
    );

    const onCryptoCurrencyChange = useCallback(
        (selected: CoinmarketAccountOptionsGroupOptionProps) => {
            const networkSymbol = cryptoToNetworkSymbol(selected.value);
            const cryptoSelectedCurrent = getValues(FORM_SEND_CRYPTO_CURRENCY_SELECT);
            const isSameCryptoSelected =
                cryptoSelectedCurrent &&
                cryptoSelectedCurrent.descriptor === selected.descriptor &&
                cryptoToNetworkSymbol(cryptoSelectedCurrent.value) === networkSymbol;
            const account = accountsSorted.find(
                item => item.descriptor === selected.descriptor && item.symbol === networkSymbol,
            );

            if (!account || isSameCryptoSelected) return;

            setValue(FORM_OUTPUT_ADDRESS, '');
            setValue(FORM_OUTPUT_AMOUNT, '');
            setValue(FORM_CRYPTO_TOKEN, selected?.contractAddress ?? null);

            if (networkSymbol && isEthereumAccountSymbol(networkSymbol)) {
                // set token address for ERC20 transaction to estimate the fees more precisely
                setValue(FORM_OUTPUT_ADDRESS, selected?.contractAddress ?? '');
            }

            if (networkSymbol === 'sol') {
                setValue(FORM_OUTPUT_ADDRESS, selected?.descriptor ?? '');
            }

            setValue(FORM_OUTPUT_MAX, undefined);
            setValue(FORM_OUTPUT_AMOUNT, '');
            setValue(FORM_OUTPUT_FIAT, '');
            setAmountLimits(undefined);

            coinmarketFiatValues?.fiatRatesUpdater(
                getValues(FORM_OUTPUT_CURRENCY)?.value as FiatCurrencyCode,
            );

            setAccountOnChange(account);

            changeFeeLevel('normal'); // reset fee level
        },
        [
            getValues,
            accountsSorted,
            setValue,
            setAmountLimits,
            coinmarketFiatValues,
            setAccountOnChange,
            changeFeeLevel,
        ],
    );

    const setRatioAmount = useCallback(
        (divisor: number) => {
            const amount = tokenData
                ? new BigNumber(tokenData.balance || '0')
                      .dividedBy(divisor)
                      .decimalPlaces(tokenData.decimals)
                      .toString()
                : new BigNumber(account.formattedBalance)
                      .dividedBy(divisor)
                      .decimalPlaces(networkDecimals)
                      .toString();
            const cryptoInputValue = shouldSendInSats
                ? amountToSatoshi(amount, networkDecimals)
                : amount;
            clearErrors([FORM_OUTPUT_FIAT, FORM_OUTPUT_AMOUNT]);
            setValue(FORM_OUTPUT_AMOUNT, cryptoInputValue, { shouldDirty: true });
            setValue(FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
        },
        [
            tokenData,
            account.formattedBalance,
            networkDecimals,
            shouldSendInSats,
            clearErrors,
            setValue,
        ],
    );

    const setAllAmount = useCallback(() => {
        setValue(FORM_OUTPUT_MAX, 0, { shouldDirty: true });
        setValue(FORM_OUTPUT_FIAT, '', { shouldDirty: true });
        setValue(FORM_OUTPUT_AMOUNT, '', { shouldDirty: true });
        clearErrors([FORM_OUTPUT_FIAT, FORM_OUTPUT_AMOUNT]);

        composeRequest(FORM_OUTPUT_AMOUNT);
    }, [clearErrors, composeRequest, setValue]);

    return {
        isBalanceZero,

        calculateCryptoAmountFromFiat,
        onFiatCurrencyChange,
        onCryptoCurrencyChange,
        setRatioAmount,
        setAllAmount,
    };
};
