import { getDisplaySymbol } from '@suite-common/wallet-config';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    TradingBuyFormProps,
    TradingExchangeFormProps,
    TradingFormInputFiatCryptoWrapProps,
    TradingSellFormProps,
} from 'src/types/trading/tradingForm';
import { TradingFormSwitcherCryptoFiat } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormSwitcherCryptoFiat';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormInputCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { TradingFormInputFiat } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiat';
import { Translation } from 'src/components/suite';

export const TradingFormInputFiatCrypto = <
    TFieldValues extends TradingSellFormProps | TradingBuyFormProps | TradingExchangeFormProps,
>({
    showLabel = true,
    ...formProps
}: TradingFormInputFiatCryptoWrapProps<TFieldValues>) => {
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();
    const {
        type,
        form: {
            state: { isFormLoading, toggleAmountInCrypto },
        },
    } = useTradingFormContext();
    const {
        cryptoCurrencyLabel,
        cryptoInputName,
        currencySelectLabel,
        cryptoSelectName,
        methods,
        fiatInputName,
    } = formProps;
    const { amountInCrypto } = methods.getValues();
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoCurrencyLabel);
    const displaySymbol = coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);

    const inputProps = {
        cryptoInputName,
        fiatInputName,
        cryptoSelectName,
        methods,
        labelLeft: showLabel ? <Translation id={amountLabels.inputLabel} /> : undefined,
        labelRight: showLabel ? (
            <TradingFormSwitcherCryptoFiat
                currency={!amountInCrypto ? displaySymbol : currencySelectLabel ?? ''}
                isDisabled={isFormLoading}
                toggleAmountInCrypto={toggleAmountInCrypto}
            />
        ) : undefined,
    };

    return amountInCrypto ? (
        <TradingFormInputCryptoAmount {...inputProps} />
    ) : (
        <TradingFormInputFiat {...inputProps} />
    );
};
