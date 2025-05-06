import {
    type TradingBuyFormProps,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
    useTradingInfo,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';

import { Translation } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFormInputFiatCryptoWrapProps } from 'src/types/trading/tradingForm';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormInputCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount';
import { TradingFormInputFiat } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiat';
import { TradingFormSwitcherCryptoFiat } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormSwitcherCryptoFiat';

export const TradingFormInputFiatCrypto = <
    TFieldValues extends TradingSellFormProps | TradingBuyFormProps | TradingExchangeFormProps,
>({
    showLabel = true,
    ...formProps
}: TradingFormInputFiatCryptoWrapProps<TFieldValues>) => {
    const {
        type,
        form: {
            state: { isFormLoading, toggleAmountInCrypto },
        },
    } = useTradingFormContext();
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();

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
                currency={!amountInCrypto ? displaySymbol : (currencySelectLabel ?? '')}
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
