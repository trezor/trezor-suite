import { useWatch } from 'react-hook-form';

import { useSelector } from '@suite-common/redux-utils';
import {
    TRADING_FORM_CRYPTO_TOKEN,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_OUTPUT_MAX,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingSellFormProps,
} from '@suite-common/trading';
import {
    selectIsNetworkReserveEnabled,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';

import { useTradingCryptoAssetChange } from 'src/hooks/wallet/trading/form/common/useTradingCryptoAssetChange';
import { useTradingFiatCryptoAmount } from 'src/hooks/wallet/trading/form/common/useTradingFiatCryptoAmount';
import { useTradingSendAssetBalance } from 'src/hooks/wallet/trading/form/common/useTradingSendAssetBalance';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    type TradingUseFormActionsProps,
    type TradingUseFormActionsReturnProps,
} from 'src/types/trading/tradingForm';
import {
    calcMaxTokenAmount,
    calcRatioAmount,
} from 'src/utils/wallet/trading/sellExchangeAmountUtils';

type UseSellFormInputsProps = TradingUseFormActionsProps<TradingSellFormProps>;

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
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);
    const accounts = useSelector(selectVisibleDeviceAccounts);

    const { setValue, clearErrors, control } = methods;

    const [sendCryptoSelect, tokenAddress, outputCurrency] = useWatch({
        control,
        name: [
            TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
            TRADING_FORM_CRYPTO_TOKEN,
            TRADING_FORM_OUTPUT_CURRENCY,
        ],
    });

    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(
        sendCryptoSelect?.networkSymbol,
    );

    const { tokenData, isBalanceZero, networkDecimals, tradingFiatValues, feeInUnits } =
        useTradingSendAssetBalance({
            account,
            sendCryptoSelect,
            tokenAddress,
            outputCurrency,
            composedLevels,
            composedTransactionInfo,
        });

    const { fractionButton, setFractionButton, onFiatCurrencyChange } = useTradingFiatCryptoAmount({
        methods,
        tradingFiatValues,
        networkDecimals,
        shouldSendInSats,
    });

    const { onCryptoCurrencyChange } = useTradingCryptoAssetChange({
        account,
        accounts,
        methods,
        tradingFiatValues,
        setAmountLimits,
        changeFeeLevel,
        setComposedLevels,
        setAccountOnChange,
    });

    const setRatioAmount = (divisor: number) => {
        if (!account) {
            return;
        }

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

    return {
        isBalanceZero,

        onFiatCurrencyChange,
        onCryptoCurrencyChange,
        setRatioAmount,
        setAllAmount,

        fractionButton,
        setFractionButton,
    };
};
