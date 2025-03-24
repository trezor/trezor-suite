import { useCallback, useEffect, useRef, useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useDebounce } from 'react-use';

import { FiatCurrencyCode } from 'invity-api';

import {
    TradingExchangeFormProps,
    cryptoIdToSymbol,
    exchangeUtils,
    useTradingInfo,
} from '@suite-common/trading';
import { selectAccounts, selectSelectedDevice } from '@suite-common/wallet-core';
import {
    amountToSmallestUnit,
    formatAmount,
    fromFiatCurrency,
    isZero,
} from '@suite-common/wallet-utils';
import { BigNumber, isChanged } from '@trezor/utils';

import {
    FORM_CRYPTO_TOKEN,
    FORM_OUTPUT_ADDRESS,
    FORM_OUTPUT_AMOUNT,
    FORM_OUTPUT_CURRENCY,
    FORM_OUTPUT_FIAT,
    FORM_OUTPUT_MAX,
    FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
    FORM_SEND_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/trading/form';
import { useSelector } from 'src/hooks/suite';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { TradingAccountOptionsGroupOptionProps } from 'src/types/trading/trading';
import {
    TradingSellExchangeFormProps,
    TradingSellFormProps,
    TradingUseFormActionsProps,
    TradingUseFormActionsReturnProps,
} from 'src/types/trading/tradingForm';
import {
    getAddressAndTokenFromAccountOptionsGroupProps,
    getTradingNetworkDecimals,
    tradingGetSortedAccounts,
} from 'src/utils/wallet/trading/tradingUtils';

/**
 * shareable sub-hook used in useTradingSellForm & useTradingExchangeForm
 * managing effects on input changes
 * @return functions and values to handle form inputs and update fee levels
 */
export const useTradingFormActions = <T extends TradingSellExchangeFormProps>({
    account,
    methods,
    isNotFormPage,
    draftUpdated,
    type,
    handleChange,
    setAmountLimits,
    changeFeeLevel,
    composeRequest,
    setAccountOnChange,
    setComposedLevels,
}: TradingUseFormActionsProps<T>): TradingUseFormActionsReturnProps => {
    const { symbol } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectSelectedDevice);
    const accountsSorted = tradingGetSortedAccounts({
        accounts,
        deviceState: device?.state?.staticSessionId,
    });
    const [isUsedFractionButton, setIsUsedFractionButton] = useState(false);
    const { buildDefaultCryptoOption } = useTradingInfo(type);

    const { getValues, setValue, clearErrors, handleSubmit, control } =
        methods as unknown as UseFormReturn<TradingSellExchangeFormProps>;
    const { outputs, sendCryptoSelect } = getValues();
    const values = useWatch<TradingSellExchangeFormProps>({ control });
    const previousValues = useRef<typeof values | null>(isNotFormPage ? draftUpdated : null);
    const tokenAddress = outputs?.[0]?.token;
    const tokenData = account.tokens?.find(t => t.contract === tokenAddress);
    const isBalanceZero = tokenData
        ? isZero(tokenData.balance || '0')
        : isZero(account.formattedBalance);
    const tradingFiatValues = useTradingFiatValues({
        sendCryptoSelect,
        fiatCurrency: getValues().outputs?.[0]?.currency?.value as FiatCurrencyCode,
    });
    const networkDecimals = getTradingNetworkDecimals({
        sendCryptoSelect,
    });

    // on manual change of crypto amount, set fiat amount
    const onFiatCurrencyChange = async (value: FiatCurrencyCode) => {
        setIsUsedFractionButton(false);

        if (!tradingFiatValues) return;

        const rate = await tradingFiatValues.fiatRatesUpdater(value);
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
    };

    // watch change in fiat amount and recalculate fees on change
    const calculateCryptoAmountFromFiat = useCallback(
        (fiatAmount: string | undefined) => {
            const fiatCurrency = getValues(FORM_OUTPUT_CURRENCY);

            if (!tradingFiatValues || !fiatCurrency || !fiatAmount) {
                return;
            }

            const cryptoAmount = fromFiatCurrency(
                fiatAmount,
                networkDecimals,
                tradingFiatValues.fiatRate?.rate,
            );

            const formattedCryptoAmount =
                cryptoAmount && shouldSendInSats
                    ? amountToSmallestUnit(cryptoAmount, networkDecimals)
                    : cryptoAmount ?? '';
            setValue(FORM_OUTPUT_AMOUNT, formattedCryptoAmount, { shouldValidate: true });
        },
        [getValues, tradingFiatValues, networkDecimals, shouldSendInSats, setValue],
    );

    const setExchangeReceiveCrypto = (selected: TradingAccountOptionsGroupOptionProps) => {
        if (type !== 'exchange') return;

        const valuesTyped = values as TradingExchangeFormProps;

        if (selected.value === valuesTyped?.receiveCryptoSelect?.value) {
            const receiveCryptoSelect = exchangeUtils.tradingGetExchangeReceiveCryptoId(
                selected.value,
                valuesTyped?.receiveCryptoSelect?.value,
            );

            setValue(
                FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
                buildDefaultCryptoOption(receiveCryptoSelect),
            );
        }
    };

    const onCryptoCurrencyChange = async (selected: TradingAccountOptionsGroupOptionProps) => {
        const symbol = cryptoIdToSymbol(selected.value);
        const cryptoSelectedCurrent = getValues(FORM_SEND_CRYPTO_CURRENCY_SELECT);
        const isSameCryptoSelected =
            cryptoSelectedCurrent &&
            cryptoSelectedCurrent.descriptor === selected.descriptor &&
            cryptoSelectedCurrent.value === selected.value;
        const account = accountsSorted.find(
            item => item.descriptor === selected.descriptor && item.symbol === symbol,
        );

        if (!account || isSameCryptoSelected) return;

        const { address, token } = getAddressAndTokenFromAccountOptionsGroupProps(selected);
        setValue(FORM_OUTPUT_ADDRESS, address);
        setValue(FORM_CRYPTO_TOKEN, token);
        setValue(FORM_OUTPUT_MAX, undefined);
        setValue(FORM_OUTPUT_FIAT, '');
        setValue(FORM_OUTPUT_AMOUNT, '');
        setAmountLimits(undefined);
        setComposedLevels(undefined);

        await tradingFiatValues?.fiatRatesUpdater(
            getValues(FORM_OUTPUT_CURRENCY)?.value as FiatCurrencyCode,
        );

        setAccountOnChange(account);
        setExchangeReceiveCrypto(selected);
        setValue(FORM_SEND_CRYPTO_CURRENCY_SELECT, selected);

        changeFeeLevel('normal'); // reset fee level
    };

    const setRatioAmount = (divisor: number) => {
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
            ? amountToSmallestUnit(amount, networkDecimals)
            : amount;
        clearErrors([FORM_OUTPUT_FIAT, FORM_OUTPUT_AMOUNT]);
        setValue(FORM_OUTPUT_AMOUNT, cryptoInputValue, { shouldDirty: true });
        setValue(FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
        setIsUsedFractionButton(true);
    };

    const setAllAmount = () => {
        setValue(FORM_OUTPUT_MAX, 0, { shouldDirty: true });
        setValue(FORM_OUTPUT_FIAT, '', { shouldDirty: true });
        setValue(FORM_OUTPUT_AMOUNT, '', { shouldDirty: true });
        clearErrors([FORM_OUTPUT_FIAT, FORM_OUTPUT_AMOUNT]);

        setIsUsedFractionButton(true);
        composeRequest(FORM_OUTPUT_AMOUNT);
    };

    // call change handler on every change of text inputs with debounce
    useDebounce(
        () => {
            const fiatValue = values?.outputs?.[0]?.fiat;
            const cryptoValue = values?.outputs?.[0]?.amount;
            const fiatChanged = isChanged(previousValues.current?.outputs?.[0].fiat, fiatValue);
            const cryptoChanged = isChanged(
                previousValues.current?.outputs?.[0].amount,
                cryptoValue,
            );

            // this will also update crypto amount
            // controlling setMaxOutputId prevents from double request
            if (fiatChanged && !isUsedFractionButton) {
                calculateCryptoAmountFromFiat(fiatValue);
            }

            // calculateCryptoAmountFromFiat will update crypto amount - avoiding double request
            if (cryptoChanged) {
                handleSubmit(() => {
                    handleChange();
                })();
                setIsUsedFractionButton(false);

                previousValues.current = values;
            }
        },
        500,
        [previousValues, handleChange, handleSubmit],
    );

    // call change handler on every change of select inputs
    // effect only for sell form
    useEffect(() => {
        if (type !== 'sell') return;

        if (
            isChanged(
                (previousValues.current as TradingSellFormProps | null)?.countrySelect,
                (values as TradingSellFormProps).countrySelect,
            ) ||
            isChanged(
                previousValues.current?.outputs?.[0]?.currency?.value,
                values.outputs?.[0]?.currency?.value,
            )
        ) {
            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [previousValues, values, handleChange, handleSubmit, isNotFormPage, type]);

    // call change handler on every change of select inputs
    // effect only for exchange form
    useEffect(() => {
        if (type !== 'exchange') return;

        if (
            isChanged(
                (previousValues.current as TradingExchangeFormProps)?.receiveCryptoSelect?.value,
                (values as TradingExchangeFormProps)?.receiveCryptoSelect?.value,
            )
        ) {
            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [previousValues, values, handleChange, handleSubmit, isNotFormPage, type]);

    return {
        isBalanceZero,

        onFiatCurrencyChange,
        onCryptoCurrencyChange,
        setRatioAmount,
        setAllAmount,
    };
};
