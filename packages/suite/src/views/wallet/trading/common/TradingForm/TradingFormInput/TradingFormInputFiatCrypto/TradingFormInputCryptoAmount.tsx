import { useCallback, useEffect, useMemo } from 'react';
import { type FieldErrors, type UseFormReturn, useWatch } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import {
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_MAX,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingBuyFormProps,
    getNetworkDecimalsWithFallback,
    selectTradingSendAccount,
    useTradingUtils,
} from '@suite-common/trading';
import { formInputsMaxLength } from '@suite-common/validators';
import { getDisplaySymbol , selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { selectAccountByKey, selectIsNetworkReserveEnabled } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { NumberInput } from '@trezor/product-components';
import { useDidUpdate } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
    type TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import {
    isTradingBuyContext,
    isTradingExchangeOrSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { getFeeInUnits, tradingGetAccountLabel } from 'src/utils/wallet/trading/tradingUtils';

import { TradingFormInputAmountPlaceholder } from './TradingFormInputAmountPlaceholder';
import { getCryptoInputRules } from './tradingFormInputFiatCryptoRules';

type TradingFormInputCryptoAmountContentProps = TradingFormInputFiatCryptoProps & {
    validationAccount: Account;
};

const TradingFormInputCryptoAmountContent = ({
    validationAccount,
    cryptoInputName,
    fiatInputName,
    cryptoSelectName,
    labelLeft,
    labelRight,
}: TradingFormInputCryptoAmountContentProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const { getAssetDecimals } = useTradingAssetDecimals();
    const locale = useSelector(selectLanguage);
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const context = useTradingFormContext();
    const { amountLimits, network } = context;
    const {
        control,
        formState: { errors },
        getValues,
        setValue,
        trigger,
        clearErrors,
    } = context as UseFormReturn<TradingAllFormProps>;

    const { shouldSendInSats } = useBitcoinAmountUnit(validationAccount.symbol);

    const isBuyContext = isTradingBuyContext(context);
    const isExchangeOrSellContext = isTradingExchangeOrSellContext(context);
    const setFractionButton = isExchangeOrSellContext
        ? context.form.helpers.setFractionButton
        : undefined;
    const setShowReserveBanner = isExchangeOrSellContext ? context.setShowReserveBanner : undefined;

    const cryptoSelect = getValues(cryptoSelectName);
    const outputToken = getValues('outputs')?.[0]?.token;
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoSelect?.id);
    const displaySymbol = tradingGetAccountLabel(
        getDisplaySymbol(networkConfigDeps, coinSymbol ?? '', contractAddress),
        shouldSendInSats,
    );
    const decimals = isBuyContext
        ? getNetworkDecimalsWithFallback(networkConfigDeps, network?.symbol)
        : getAssetDecimals({
              accountKey: getValues(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT)?.accountKey,
              cryptoId: cryptoSelect?.id,
          });
    const feeInUnits = isExchangeOrSellContext
        ? getFeeInUnits({
              ...networkConfigDeps,
              symbol: validationAccount.symbol,
              composedLevels: context.composedLevels,
              selectedFee: context.composedTransactionInfo?.selectedFee,
          })
        : undefined;
    const cryptoInputError =
        cryptoInputName === TRADING_FORM_OUTPUT_AMOUNT
            ? (errors as FieldErrors<TradingSellExchangeFormProps>)?.outputs?.[0]?.amount
            : (errors as FieldErrors<TradingBuyFormProps>).cryptoInput;
    const isNetworkReserveError =
        isExchangeOrSellContext && cryptoInputError?.type === 'networkReserve';

    const cryptoInputRules = useMemo(
        () =>
            getCryptoInputRules({
                ...networkConfigDeps,
                isBuyContext,
                translationString,
                shouldSendInSats,
                decimals,
                amountLimits,
                formatter: CryptoAmountFormatter,
                validationAccount,
                outputToken,
                isNetworkReserveEnabled,
                contractAddress,
                feeInUnits,
            }),
        [
            isBuyContext,
            translationString,
            shouldSendInSats,
            decimals,
            amountLimits,
            CryptoAmountFormatter,
            validationAccount,
            outputToken,
            isNetworkReserveEnabled,
            contractAddress,
            feeInUnits,
        ],
    );

    const handleChange = useCallback(() => {
        if (setFractionButton) {
            setValue(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
            setFractionButton(undefined);
        }
        clearErrors(fiatInputName);
    }, [setValue, setFractionButton, clearErrors, fiatInputName]);

    useEffect(() => {
        setShowReserveBanner?.(isNetworkReserveError);
    }, [isNetworkReserveError, setShowReserveBanner]);

    useDidUpdate(() => {
        if (amountLimits) {
            trigger([cryptoInputName]);
        }
    }, [amountLimits, trigger]);

    useDidUpdate(() => {
        trigger([cryptoInputName]);
    }, [cryptoInputName, trigger, validationAccount.key]);

    return (
        <NumberInput
            name={cryptoInputName}
            locale={locale}
            labelLeft={labelLeft}
            labelRight={labelRight}
            onChange={handleChange}
            hasError={!!cryptoInputError}
            control={control}
            rules={cryptoInputRules}
            maxLength={formInputsMaxLength.amount}
            bottomText={cryptoInputError?.message || null}
            rightContent={<>{displaySymbol}</>}
            data-testid="@trading/form/crypto-input"
        />
    );
};

export const TradingFormInputCryptoAmount = (props: TradingFormInputFiatCryptoProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const context = useTradingFormContext();
    const { control } = context as UseFormReturn<TradingAllFormProps>;

    const sendCryptoSelect = useWatch({
        control,
        name: TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    });
    const selectedSendAccount = useSelector(state =>
        selectAccountByKey(state, sendCryptoSelect?.accountKey),
    );
    const sendAccount = useSelector(state =>
        selectTradingSendAccount(state, context.type, networkConfigDeps),
    );
    const validationAccount = selectedSendAccount ?? sendAccount;

    if (!validationAccount) {
        return (
            <TradingFormInputAmountPlaceholder
                name={props.cryptoInputName}
                labelLeft={props.labelLeft}
                labelRight={props.labelRight}
            />
        );
    }

    return <TradingFormInputCryptoAmountContent validationAccount={validationAccount} {...props} />;
};
