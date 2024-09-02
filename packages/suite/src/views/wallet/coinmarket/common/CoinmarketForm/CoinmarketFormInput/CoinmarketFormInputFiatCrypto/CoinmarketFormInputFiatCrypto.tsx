import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketBuyFormProps,
    CoinmarketExchangeFormProps,
    CoinmarketFormInputFiatCryptoWrapProps,
    CoinmarketSellFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import CoinmarketFormSwitcherCryptoFiat from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormSwitcherCryptoFiat';
import CoinmarketFormInputFiat from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiat';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import { coinmarketGetAmountLabels } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketFormInputCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputCryptoAmount';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';

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

    const { amountInCrypto } = formProps.methods.getValues();
    const amountLabels = coinmarketGetAmountLabels({ type, amountInCrypto });

    return (
        <>
            {showLabel ? (
                <CoinmarketFormInputLabel label={amountLabels.inputLabel}>
                    <CoinmarketFormSwitcherCryptoFiat
                        symbol={
                            !amountInCrypto && formProps.cryptoCurrencyLabel
                                ? cryptoIdToCoinSymbol(formProps.cryptoCurrencyLabel)
                                : formProps.currencySelectLabel ?? ''
                        }
                        isDisabled={isFormLoading}
                        toggleAmountInCrypto={toggleAmountInCrypto}
                    />
                </CoinmarketFormInputLabel>
            ) : null}
            {amountInCrypto ? (
                <CoinmarketFormInputCryptoAmount
                    cryptoInputName={formProps.cryptoInputName}
                    fiatInputName={formProps.fiatInputName}
                    cryptoSelectName={formProps.cryptoSelectName}
                    methods={{ ...formProps.methods }}
                />
            ) : (
                <CoinmarketFormInputFiat
                    cryptoInputName={formProps.cryptoInputName}
                    fiatInputName={formProps.fiatInputName}
                    cryptoSelectName={formProps.cryptoSelectName}
                    methods={{ ...formProps.methods }}
                />
            )}
        </>
    );
};
