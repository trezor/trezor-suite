import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketBuyFormProps,
    CoinmarketExchangeFormProps,
    CoinmarketFormInputFiatCryptoWrapProps,
    CoinmarketSellFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import CoinmarketFormSwitcherCryptoFiat from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormSwitcherCryptoFiat';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import CoinmarketFormInputFiat from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiat';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import CoinmarketFormInputCrypto from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputCrypto';
import { coinmarketGetAmountLabels } from 'src/utils/wallet/coinmarket/coinmarketUtils';

const CoinmarketFormInputFiatCrypto = <
    TFieldValues extends
        | CoinmarketSellFormProps
        | CoinmarketBuyFormProps
        | CoinmarketExchangeFormProps,
>({
    showLabel = true,
    ...formProps
}: CoinmarketFormInputFiatCryptoWrapProps<TFieldValues>) => {
    const context = useCoinmarketFormContext();
    const {
        type,
        form: {
            state: { isFormLoading, toggleAmountInCrypto },
        },
    } = context;

    const { amountInCrypto, cryptoSelect } = formProps.methods.getValues();
    const amountLabels = coinmarketGetAmountLabels({ type, amountInCrypto });

    return (
        <>
            {showLabel ? (
                <CoinmarketFormInputLabel label={amountLabels.label1}>
                    <CoinmarketFormSwitcherCryptoFiat
                        symbol={
                            !amountInCrypto && cryptoSelect?.value
                                ? cryptoToCoinSymbol(cryptoSelect.value)
                                : formProps.currencySelectLabel ?? ''
                        }
                        isDisabled={isFormLoading}
                        toggleAmountInCrypto={toggleAmountInCrypto}
                    />
                </CoinmarketFormInputLabel>
            ) : null}
            {amountInCrypto ? (
                <CoinmarketFormInputCrypto
                    cryptoInputName={formProps.cryptoInputName}
                    fiatInputName={formProps.fiatInputName}
                    methods={{ ...formProps.methods }}
                />
            ) : (
                <CoinmarketFormInputFiat
                    cryptoInputName={formProps.cryptoInputName}
                    fiatInputName={formProps.fiatInputName}
                    methods={{ ...formProps.methods }}
                />
            )}
        </>
    );
};

export default CoinmarketFormInputFiatCrypto;
