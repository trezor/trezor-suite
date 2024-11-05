import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketBuyFormProps,
    CoinmarketExchangeFormProps,
    CoinmarketFormInputFiatCryptoWrapProps,
    CoinmarketSellFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketFormSwitcherCryptoFiat } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormSwitcherCryptoFiat';
import { coinmarketGetAmountLabels } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketFormInputCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputCryptoAmount';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CoinmarketFormInputFiat } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiat';
import { Translation } from 'src/components/suite';

export const CoinmarketFormInputFiatCrypto = <
    TFieldValues extends
        | CoinmarketSellFormProps
        | CoinmarketBuyFormProps
        | CoinmarketExchangeFormProps,
>({
    showLabel = true,
    ...formProps
}: CoinmarketFormInputFiatCryptoWrapProps<TFieldValues>) => {
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();
    const {
        type,
        form: {
            state: { isFormLoading, toggleAmountInCrypto },
        },
    } = useCoinmarketFormContext();
    const {
        cryptoCurrencyLabel,
        cryptoInputName,
        currencySelectLabel,
        cryptoSelectName,
        methods,
        fiatInputName,
    } = formProps;
    const { amountInCrypto } = methods.getValues();
    const amountLabels = coinmarketGetAmountLabels({ type, amountInCrypto });

    const inputProps = {
        cryptoInputName,
        fiatInputName,
        cryptoSelectName,
        methods,
        labelLeft: showLabel ? <Translation id={amountLabels.inputLabel} /> : undefined,
        labelRight: showLabel ? (
            <CoinmarketFormSwitcherCryptoFiat
                symbol={
                    !amountInCrypto && cryptoCurrencyLabel
                        ? cryptoIdToCoinSymbol(cryptoCurrencyLabel)
                        : currencySelectLabel ?? ''
                }
                isDisabled={isFormLoading}
                toggleAmountInCrypto={toggleAmountInCrypto}
            />
        ) : undefined,
    };

    return amountInCrypto ? (
        <CoinmarketFormInputCryptoAmount {...inputProps} />
    ) : (
        <CoinmarketFormInputFiat {...inputProps} />
    );
};
