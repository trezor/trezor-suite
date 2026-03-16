import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';
import { useDebounce } from 'react-use';

import { type FiatCurrencyCode } from 'invity-api';

import {
    TRADING_FORM_CRYPTO_TOKEN,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_OUTPUT_MAX,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingAssetSellOption,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
    isCountrySubdivisionEmpty,
    mapFiatCurrencyCodeToBaseCurrencyCode,
    tradingExchangeActions,
} from '@suite-common/trading';
import {
    selectAccountByKey,
    selectIsNetworkReserveEnabled,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    fromBaseCurrencyToCryptoUnit,
    getCryptoAmountWithReserve,
    isZero,
} from '@suite-common/wallet-utils';
import { BigNumber, isChanged } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    type TradingSellExchangeFormProps,
    type TradingUseFormActionsProps,
    type TradingUseFormActionsReturnProps,
} from 'src/types/trading/tradingForm';
import { getFeeInUnits, resolveAddressAndToken } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingAssetDecimals } from './useTradingAssetDecimals';

/**
 * shareable sub-hook used in useTradingSellForm & useTradingExchangeForm
 * managing effects on input changes
 * @return functions and values to handle form inputs and update fee levels
 */
export const useTradingFormActions = <T extends TradingSellExchangeFormProps>({
    account,
    methods,
    pageType,
    draftUpdated,
    type,
    handleChange,
    setAmountLimits,
    changeFeeLevel,
    composeRequest,
    setAccountOnChange,
    setComposedLevels,
    composedLevels,
    composedTransactionInfo,
    setShowReserveBanner,
}: TradingUseFormActionsProps<T>): TradingUseFormActionsReturnProps => {
    const dispatch = useDispatch();
    const { symbol } = account;
    const { shouldSendInSats } = useBitcoinAmountUnit(symbol);
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const isNotFormPage = pageType !== 'form';
    const [fractionButtonState, setFractionButtonState] = useState<number | undefined>(undefined);

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

    const sendCryptoAccount = useSelector(state =>
        selectAccountByKey(state, sendCryptoSelect?.accountKey),
    );
    const tradingFiatValues = useTradingFiatValues({
        cryptoId: sendCryptoSelect?.id,
        amount: sendCryptoAccount?.balance,
        fiatCurrency: getValues().outputs?.[0]?.currency?.value || undefined,
    });

    const { getAssetDecimals } = useTradingAssetDecimals();
    const networkDecimals = useMemo(
        () =>
            getAssetDecimals({
                accountKey: sendCryptoSelect?.accountKey,
                cryptoId: sendCryptoSelect?.id,
            }),
        [getAssetDecimals, sendCryptoSelect?.accountKey, sendCryptoSelect?.id],
    );

    const feeInUnits = getFeeInUnits({
        symbol: account.symbol,
        composedLevels,
        selectedFee: composedTransactionInfo?.selectedFee,
    });

    const setFractionButton = (fraction: number | undefined) => {
        if (fraction !== 1) {
            setValue(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
        }

        setFractionButtonState(fraction);
    };

    // on manual change of crypto amount, set fiat amount
    const onFiatCurrencyChange = async (value: FiatCurrencyCode) => {
        setFractionButton(undefined);

        if (!tradingFiatValues) return;

        const mappedBaseCurrencyCode = mapFiatCurrencyCodeToBaseCurrencyCode(value);
        if (!mappedBaseCurrencyCode) return;

        const rate = await tradingFiatValues.fiatRatesUpdater(mappedBaseCurrencyCode);
        const amount = getValues(TRADING_FORM_OUTPUT_AMOUNT);
        const formattedAmount = new BigNumber(
            shouldSendInSats ? convertAmountSubunitsToUnits(amount, networkDecimals) : amount,
        );

        if (
            rate?.rate &&
            formattedAmount &&
            !formattedAmount.isNaN() &&
            formattedAmount.gt(0) // formatAmount() returns '-1' on error
        ) {
            const fiatValueBigNumber = formattedAmount.multipliedBy(rate.rate);

            setValue(TRADING_FORM_OUTPUT_FIAT, fiatValueBigNumber.toFixed(2), {
                shouldValidate: true,
            });
        }
    };

    // watch change in fiat amount and recalculate fees on change
    const calculateCryptoAmountFromFiat = useCallback(
        (fiatAmount: string | undefined) => {
            const fiatCurrency = getValues(TRADING_FORM_OUTPUT_CURRENCY);

            if (!tradingFiatValues || !fiatCurrency || !fiatAmount) {
                return;
            }

            const cryptoAmount =
                fromBaseCurrencyToCryptoUnit({
                    fiatAmount,
                    rate: tradingFiatValues.fiatRate?.rate,
                })?.toFixed(networkDecimals) ?? null;

            const formattedCryptoAmount =
                cryptoAmount && shouldSendInSats
                    ? convertAmountUnitsToSubunits(cryptoAmount, networkDecimals)
                    : (cryptoAmount ?? '');
            setValue(TRADING_FORM_OUTPUT_AMOUNT, formattedCryptoAmount, { shouldValidate: true });
        },
        [getValues, tradingFiatValues, networkDecimals, shouldSendInSats, setValue],
    );

    const onCryptoCurrencyChange = async (selected: TradingAssetSellOption) => {
        const cryptoSelectedCurrent = getValues(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT);
        const isSameCryptoSelected =
            cryptoSelectedCurrent &&
            cryptoSelectedCurrent.accountKey === selected.accountKey &&
            cryptoSelectedCurrent.id === selected.id;
        const account = accounts.find(item => item.key === selected.accountKey);

        if (!account || isSameCryptoSelected) return;

        const { token } = resolveAddressAndToken(account, selected.contractAddress);

        // setValue(TRADING_FORM_OUTPUT_ADDRESS, address);
        setValue(TRADING_FORM_CRYPTO_TOKEN, token);
        setValue(TRADING_FORM_OUTPUT_MAX, undefined);
        setValue(TRADING_FORM_OUTPUT_FIAT, '');
        setValue(TRADING_FORM_OUTPUT_AMOUNT, '');
        setValue(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT, selected);
        setAmountLimits(undefined);
        setComposedLevels(undefined);

        setAccountOnChange(account);
        changeFeeLevel('normal'); // reset fee level

        const mappedBaseCurrencyCode = mapFiatCurrencyCodeToBaseCurrencyCode(
            getValues(TRADING_FORM_OUTPUT_CURRENCY)?.value,
        );

        if (mappedBaseCurrencyCode) {
            await tradingFiatValues?.fiatRatesUpdater(
                mappedBaseCurrencyCode,
                selected.contractAddress as TokenAddress,
            );
        }
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
            ? convertAmountUnitsToSubunits(amount, networkDecimals)
            : amount;
        clearErrors([TRADING_FORM_OUTPUT_FIAT, TRADING_FORM_OUTPUT_AMOUNT]);

        const cryptoAmountWithReserve = isNetworkReserveEnabled
            ? getCryptoAmountWithReserve({
                  symbol: account.symbol,
                  contractAddress: tokenAddress,
                  balance: account.formattedBalance,
                  amount: cryptoInputValue,
                  fee: feeInUnits?.toString(),
                  isNetworkReserveEnabled,
              })
            : cryptoInputValue;

        setShowReserveBanner(cryptoAmountWithReserve !== cryptoInputValue);

        setValue(TRADING_FORM_OUTPUT_AMOUNT, cryptoAmountWithReserve, { shouldDirty: true });
        setFractionButton(divisor);
    };

    const setAllAmount = () => {
        if (tokenData) {
            const maxAmount = new BigNumber(tokenData.balance || '0')
                .decimalPlaces(tokenData.decimals)
                .toString();

            const cryptoInputValue = shouldSendInSats
                ? convertAmountUnitsToSubunits(maxAmount, networkDecimals)
                : maxAmount;

            setValue(TRADING_FORM_OUTPUT_AMOUNT, cryptoInputValue, { shouldDirty: true });
        } else {
            setValue(TRADING_FORM_OUTPUT_AMOUNT, '', { shouldDirty: true });
        }

        setValue(TRADING_FORM_OUTPUT_MAX, 0, { shouldDirty: true });
        setValue(TRADING_FORM_OUTPUT_FIAT, '', { shouldDirty: true });
        clearErrors([TRADING_FORM_OUTPUT_FIAT, TRADING_FORM_OUTPUT_AMOUNT]);

        setFractionButton(1);
        composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
    };

    // reset preselectedQuote when opening swap form
    useEffect(() => {
        const cryptoValue = values?.outputs?.[0]?.amount;
        const previousCryptoValue = previousValues.current?.outputs?.[0].amount;

        if (cryptoValue === '' && previousCryptoValue === undefined) {
            dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
        }
    }, [values, previousValues, dispatch]);

    // call change handler on every change of text inputs with debounce
    useDebounce(
        () => {
            if (pageType === 'confirm' || pageType === 'retry') return;

            const fiatValue = values?.outputs?.[0]?.fiat;
            const cryptoValue = values?.outputs?.[0]?.amount;

            const previousFiatValue = previousValues.current?.outputs?.[0].fiat;
            const previousCryptoValue = previousValues.current?.outputs?.[0].amount;

            const fiatChanged = isChanged(previousFiatValue, fiatValue);
            const cryptoChanged = isChanged(previousCryptoValue, cryptoValue);

            // this will also update crypto amount
            // controlling setMaxOutputId prevents from double request
            if (fiatChanged && fractionButtonState === undefined) {
                calculateCryptoAmountFromFiat(fiatValue);
            }

            // calculateCryptoAmountFromFiat will update crypto amount - avoiding double request
            if (cryptoChanged) {
                handleSubmit(() => {
                    handleChange();
                })();
                previousValues.current = values;
            }
        },
        500,
        [values, previousValues, pageType],
    );

    // call change handler on every change of select inputs
    // effect only for sell form
    useEffect(() => {
        if (type !== 'sell' || pageType === 'confirm' || pageType === 'retry') return;

        const sellValues = values as TradingSellFormProps;

        // do not dispatch form requests until subdivision is set when country has subdivisions
        if (
            isCountrySubdivisionEmpty(
                sellValues.countrySelect?.value,
                sellValues.countrySubdivisionSelect?.value,
            )
        ) {
            return;
        }

        if (
            isChanged(
                (previousValues.current as TradingSellFormProps | null)?.countrySelect,
                sellValues.countrySelect,
            ) ||
            isChanged(
                (previousValues.current as TradingSellFormProps | null)?.countrySubdivisionSelect,
                sellValues.countrySubdivisionSelect,
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
    }, [previousValues, values, handleChange, handleSubmit, isNotFormPage, pageType, type]);

    // call change handler on every change of receive address
    // effect only for exchange form
    useEffect(() => {
        if (type !== 'exchange' || pageType === 'confirm' || pageType === 'retry') return;

        const formValues = values as TradingExchangeFormProps | null;
        const prevFormValues = previousValues.current as TradingExchangeFormProps | null;

        const receiveCryptoChanged = isChanged(
            formValues?.receiveCryptoSelect,
            prevFormValues?.receiveCryptoSelect,
        );

        const receiveAddressChanged = isChanged(
            formValues?.receiveAddress,
            prevFormValues?.receiveAddress,
        );

        if (receiveCryptoChanged || receiveAddressChanged) {
            dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [values, previousValues, handleChange, handleSubmit, dispatch, pageType, type]);

    return {
        isBalanceZero,

        onFiatCurrencyChange,
        onCryptoCurrencyChange,
        setRatioAmount,
        setAllAmount,

        fractionButton: fractionButtonState,
        setFractionButton,
    };
};
