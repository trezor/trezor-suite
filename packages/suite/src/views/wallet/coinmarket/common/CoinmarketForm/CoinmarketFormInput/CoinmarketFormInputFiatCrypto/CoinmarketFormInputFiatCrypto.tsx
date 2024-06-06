import { useSelector, useTranslation } from 'src/hooks/suite';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormInputFiatCryptoProps } from 'src/types/coinmarket/coinmarketForm';
import CoinmarketFormSwitcherCryptoFiat from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormSwitcherCryptoFiat';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import CoinmarketFormInputFiat from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputFiat';
import { CoinmarketFormInput } from 'src/views/wallet/coinmarket';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import CoinmarketFormInputCrypto from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputFiatCrypto/CoinmarketFormInputCrypto';

const CoinmarketFormInputFiatCrypto = ({
    className,
    showLabel = true,
}: CoinmarketFormInputFiatCryptoProps) => {
    const { translationString } = useTranslation();
    const account = useSelector(state => state.wallet.selectedAccount.account);
    const {
        form: {
            state: { isFormLoading, toggleWantCrypto },
        },
        getValues,
    } = useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const { wantCrypto } = getValues();

    if (!account) return null;

    return (
        <CoinmarketFormInput className={className}>
            {showLabel ? (
                <CoinmarketFormInputLabel
                    label={wantCrypto ? 'TR_COINMARKET_YOU_GET' : 'TR_COINMARKET_YOU_PAY'}
                >
                    <CoinmarketFormSwitcherCryptoFiat
                        symbol={
                            !wantCrypto
                                ? cryptoToCoinSymbol(getValues().cryptoSelect.value)
                                : translationString('TR_COINMARKET_FIAT')
                        }
                        isDisabled={isFormLoading}
                        toggleWantCrypto={toggleWantCrypto}
                    />
                </CoinmarketFormInputLabel>
            ) : null}
            {wantCrypto ? <CoinmarketFormInputCrypto /> : <CoinmarketFormInputFiat />}
        </CoinmarketFormInput>
    );
};

export default CoinmarketFormInputFiatCrypto;
