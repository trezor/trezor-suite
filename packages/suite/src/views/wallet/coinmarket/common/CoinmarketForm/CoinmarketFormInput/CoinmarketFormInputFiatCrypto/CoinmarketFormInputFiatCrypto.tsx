import { useTranslation } from 'src/hooks/suite';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFormInputFiatCryptoProps } from 'src/types/coinmarket/coinmarketForm';
import CoinmarketFormSwitcherCryptoFiat from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormSwitcherCryptoFiat';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import CoinmarketFormInputFiat from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiat';
import { CoinmarketFormInput } from 'src/views/wallet/coinmarket';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import CoinmarketFormInputCrypto from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputCrypto';
import { coinmarketGetAmountLabels } from 'src/utils/wallet/coinmarket/coinmarketUtils';

const CoinmarketFormInputFiatCrypto = ({
    className,
    showLabel = true,
}: CoinmarketFormInputFiatCryptoProps) => {
    const { translationString } = useTranslation();
    const {
        type,
        form: {
            state: { isFormLoading, toggleAmountInCrypto },
        },
        getValues,
    } = useCoinmarketFormContext();
    const { amountInCrypto, cryptoSelect } = getValues();
    const amountLabels = coinmarketGetAmountLabels({ type, amountInCrypto });

    return (
        <CoinmarketFormInput className={className}>
            {showLabel ? (
                <CoinmarketFormInputLabel label={amountLabels.label1}>
                    <CoinmarketFormSwitcherCryptoFiat
                        symbol={
                            !amountInCrypto
                                ? cryptoToCoinSymbol(cryptoSelect?.value)
                                : translationString('TR_COINMARKET_FIAT')
                        }
                        isDisabled={isFormLoading}
                        toggleAmountInCrypto={toggleAmountInCrypto}
                    />
                </CoinmarketFormInputLabel>
            ) : null}
            {amountInCrypto ? <CoinmarketFormInputCrypto /> : <CoinmarketFormInputFiat />}
        </CoinmarketFormInput>
    );
};

export default CoinmarketFormInputFiatCrypto;
