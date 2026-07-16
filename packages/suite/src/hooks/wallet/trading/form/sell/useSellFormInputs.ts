import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
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
    type TradingSellFormProps,
    mapFiatCurrencyCodeToBaseCurrencyCode,
} from '@suite-common/trading';
import {
    selectAccountByKey,
    selectIsNetworkReserveEnabled,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getDecimalsForBaseCurrency,
    isErc4626,
    isZero,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    type TradingUseFormActionsProps,
    type TradingUseFormActionsReturnProps,
} from 'src/types/trading/tradingForm';
import {
    calcCryptoFromFiat,
    calcMaxTokenAmount,
    calcRatioAmount,
} from 'src/utils/wallet/trading/sellExchangeAmountUtils';
import { getFeeInUnits, resolveAddressAndToken } from 'src/utils/wallet/trading/tradingUtils';

type UseSellFormInputsProps = Omit<
    TradingUseFormActionsProps<TradingSellFormProps>,
    'type' | 'handleChange' | 'receiveAddress'
>;

export const useSellFormInputs = ({
    account,
    methods,
    setAmountLimits,
    changeFeeLevel,
    composeRequest,
    setComposedLevels,
    composedLevels,
    composedTransactionInfo,
    setShowReserveBanner,
    setAccountOnChange,
}: UseSellFormInputsProps): TradingUseFormActionsReturnProps => {
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const [fractionButtonState, setFractionButtonState] = useState<number | undefined>(undefined);

    // TODO: source the form via useFormContext() once the trading-form family migrates to FormProvider
    const { getValues, setValue, clearErrors, control } = methods;

    const [sendCryptoSelect, tokenAddress, outputCurrency, watchedFiat] = useWatch({
        control,
        name: [
            TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
            TRADING_FORM_CRYPTO_TOKEN,
            TRADING_FORM_OUTPUT_CURRENCY,
            TRADING_FORM_OUTPUT_FIAT,
        ],
    });

    // TODO(#26292): tokenData/isBalanceZero/feeInUnits derivation is identical for exchange —
    // extract as a reusable hook during the exchange decomposition (3.4).
    const sendCryptoAccount = useSelector(state =>
        selectAccountByKey(state, sendCryptoSelect?.accountKey),
    );
    const tokenData = (sendCryptoAccount ?? account).tokens?.find(
        t => t.contract.toLowerCase() === tokenAddress?.toLowerCase(),
    );
    const isBalanceZero = tokenData
        ? isZero(tokenData.balance || '0')
        : isZero(account.formattedBalance);

    const tradingFiatValues = useTradingFiatValues({
        cryptoId: sendCryptoSelect?.id,
        amount: sendCryptoAccount?.balance,
        fiatCurrency: outputCurrency?.value || undefined,
        isErc4626: !!tokenData && isErc4626(tokenData),
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

    // TODO(#26292): shared with exchange — extract as a reusable useTradingFractionButton hook (3.4).
    const setFractionButton = (fraction: number | undefined) => {
        if (fraction !== 1) {
            setValue(TRADING_FORM_OUTPUT_MAX, undefined, { shouldDirty: true });
        }

        setFractionButtonState(fraction);
    };

    // TODO(#26292): onFiatCurrencyChange + calculateCryptoAmountFromFiat + the fiat→crypto debounce
    // are shared with exchange — extract as a reusable hook during the exchange decomposition (3.4).
    // on manual change of fiat currency, recalculate the fiat amount from the crypto amount
    const onFiatCurrencyChange = async (value: FiatCurrencyCode) => {
        setFractionButton(undefined);

        if (!tradingFiatValues) return;

        const mappedBaseCurrencyCode = mapFiatCurrencyCodeToBaseCurrencyCode(value);
        if (!mappedBaseCurrencyCode) return;

        const rate = await tradingFiatValues.fiatRatesUpdater(mappedBaseCurrencyCode);
        const amount = getValues(TRADING_FORM_OUTPUT_AMOUNT);
        const formattedAmount = shouldSendInSats
            ? subunitsToUnits({
                  value: asAmountSubunit(new BigNumber(amount)),
                  decimals: networkDecimals,
              })
            : new BigNumber(amount);

        if (
            rate?.rate &&
            formattedAmount &&
            !formattedAmount.isNaN() &&
            formattedAmount.gt(0) // formatAmount() returns '-1' on error
        ) {
            const fiatValueBigNumber = formattedAmount.multipliedBy(rate.rate);
            const fiatDecimals = getDecimalsForBaseCurrency({
                code: mappedBaseCurrencyCode,
                isInSats: false,
            });

            setValue(TRADING_FORM_OUTPUT_FIAT, fiatValueBigNumber.toFixed(fiatDecimals), {
                shouldValidate: true,
            });
        }
    };

    // recalculate the crypto amount from the fiat amount
    const calculateCryptoAmountFromFiat = useCallback(
        (fiatAmount: string | undefined) => {
            const fiatCurrency = getValues(TRADING_FORM_OUTPUT_CURRENCY);

            if (!tradingFiatValues || !fiatCurrency || !fiatAmount) {
                return;
            }

            const cryptoAmount = calcCryptoFromFiat({
                fiatAmount,
                rate: tradingFiatValues.fiatRate?.rate,
                networkDecimals,
                shouldSendInSats,
            });

            setValue(TRADING_FORM_OUTPUT_AMOUNT, cryptoAmount, { shouldValidate: true });
        },
        [getValues, tradingFiatValues, networkDecimals, shouldSendInSats, setValue],
    );

    // TODO(#26292): near-identical for exchange — extract as a reusable hook (3.4).
    const onCryptoCurrencyChange = async (selected: TradingAssetSellOption) => {
        const cryptoSelectedCurrent = getValues(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT);
        const isSameCryptoSelected =
            cryptoSelectedCurrent?.accountKey === selected.accountKey &&
            cryptoSelectedCurrent.id === selected.id;
        const selectedAccount = accounts.find(item => item.key === selected.accountKey);

        if (!selectedAccount || isSameCryptoSelected) return;

        const { token } = resolveAddressAndToken(selectedAccount, selected.contractAddress);

        setValue(TRADING_FORM_CRYPTO_TOKEN, token);
        setValue(TRADING_FORM_OUTPUT_MAX, undefined);
        setValue(TRADING_FORM_OUTPUT_FIAT, '');
        setValue(TRADING_FORM_OUTPUT_AMOUNT, '');
        setValue(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT, selected);
        setAmountLimits(undefined);
        setComposedLevels(undefined);

        setAccountOnChange(selectedAccount);
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

    // TODO(#26292): send-account sync is shared with exchange — extract as a reusable hook (3.4).
    useEffect(() => {
        const selectedAccountKey = sendCryptoSelect?.accountKey;

        if (!selectedAccountKey || selectedAccountKey === account.key) {
            return;
        }

        const selectedAccount = accounts.find(item => item.key === selectedAccountKey);

        if (!selectedAccount) {
            return;
        }

        setAccountOnChange(selectedAccount);
    }, [account.key, accounts, sendCryptoSelect?.accountKey, setAccountOnChange]);

    const setRatioAmount = (divisor: number) => {
        clearErrors([TRADING_FORM_OUTPUT_FIAT, TRADING_FORM_OUTPUT_AMOUNT]);

        const { cryptoInputValue, cryptoAmountWithReserve } = calcRatioAmount({
            divisor,
            balance: tokenData ? tokenData.balance || '0' : account.formattedBalance,
            decimals: tokenData ? tokenData.decimals : networkDecimals,
            networkDecimals,
            shouldSendInSats,
            isNetworkReserveEnabled,
            symbol: account.symbol,
            contractAddress: tokenAddress ?? tokenData?.contract,
            formattedBalance: account.formattedBalance,
            fee: feeInUnits?.toString(),
        });

        setShowReserveBanner(cryptoAmountWithReserve !== cryptoInputValue);

        setValue(TRADING_FORM_OUTPUT_AMOUNT, cryptoAmountWithReserve, { shouldDirty: true });
        setFractionButton(divisor);
    };

    const setAllAmount = () => {
        if (tokenData) {
            const cryptoInputValue = calcMaxTokenAmount({
                balance: tokenData.balance || '0',
                decimals: tokenData.decimals,
                networkDecimals,
                shouldSendInSats,
            });

            setValue(TRADING_FORM_OUTPUT_AMOUNT, cryptoInputValue, { shouldDirty: true });
        }

        setValue(TRADING_FORM_OUTPUT_MAX, 0, { shouldDirty: true });
        clearErrors([TRADING_FORM_OUTPUT_FIAT, TRADING_FORM_OUTPUT_AMOUNT]);

        setFractionButton(1);

        composeRequest(TRADING_FORM_OUTPUT_AMOUNT);
        setValue(TRADING_FORM_OUTPUT_FIAT, '', { shouldDirty: true });
    };

    // recalculate crypto amount whenever the fiat amount is typed, with debounce
    useDebounce(
        () => {
            if (fractionButtonState === undefined) {
                calculateCryptoAmountFromFiat(getValues(TRADING_FORM_OUTPUT_FIAT));
            }
        },
        500,
        [watchedFiat],
    );

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
