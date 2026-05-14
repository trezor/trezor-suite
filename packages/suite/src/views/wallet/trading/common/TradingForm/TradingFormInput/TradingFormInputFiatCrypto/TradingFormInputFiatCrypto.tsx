import { memo } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { TRADING_FORM_AMOUNT_IN_CRYPTO, useTradingUtils } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    type TradingAllFormProps,
    type TradingFormInputFiatCryptoProps,
    type TradingFormInputFiatCryptoWrapProps,
} from 'src/types/trading/tradingForm';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormInputCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount';
import { TradingFormInputFiat } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiat';
import { TradingFormSwitcherCryptoFiat } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormSwitcherCryptoFiat';

export const TradingFormInputFiatCrypto = memo(function TradingFormInputFiatCryptoInner({
    showLabel = true,
    cryptoCurrencyLabel,
    cryptoInputName,
    currencySelectLabel,
    cryptoSelectName,
    fiatInputName,
}: TradingFormInputFiatCryptoWrapProps) {
    const {
        type,
        form: {
            state: { toggleAmountInCrypto },
        },
        ...context
    } = useTradingFormContext();
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const getValues = context.getValues as UseFormReturn<TradingAllFormProps>['getValues'];

    const amountInCrypto = getValues(TRADING_FORM_AMOUNT_IN_CRYPTO);
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoCurrencyLabel);
    const displaySymbol = coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);

    const inputProps = {
        cryptoInputName,
        fiatInputName,
        cryptoSelectName,
        labelLeft: showLabel ? <Translation id={amountLabels.inputLabel} /> : undefined,
        labelRight: showLabel ? (
            <TradingFormSwitcherCryptoFiat
                currency={!amountInCrypto ? displaySymbol : (currencySelectLabel ?? '')}
                toggleAmountInCrypto={toggleAmountInCrypto}
            />
        ) : undefined,
    } satisfies TradingFormInputFiatCryptoProps;

    return amountInCrypto ? (
        <TradingFormInputCryptoAmount {...inputProps} />
    ) : (
        <TradingFormInputFiat {...inputProps} />
    );
});
