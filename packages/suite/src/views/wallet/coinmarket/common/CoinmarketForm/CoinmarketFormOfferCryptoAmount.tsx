import { CoinmarketAmountContainer, CoinmarketAmountWrapper } from 'src/views/wallet/coinmarket';
import { FormattedCryptoAmount } from 'src/components/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';
import { CryptoId } from 'invity-api';

export interface CoinmarketCryptoAmountProps {
    amount: string | number;
    cryptoId: CryptoId;
}

const CoinmarketFormOfferCryptoAmount = ({ amount, cryptoId }: CoinmarketCryptoAmountProps) => {
    const { getNetworkSymbol } = useCoinmarketInfo();
    const networkSymbol = getNetworkSymbol(cryptoId);

    if (!networkSymbol) {
        return;
    }

    return (
        <CoinmarketAmountContainer>
            <CoinmarketAmountWrapper>
                <CoinmarketCoinLogo cryptoId={cryptoId} />
                <FormattedCryptoAmount
                    value={amount}
                    symbol={networkSymbol}
                    isRawString
                    isBalance
                />
            </CoinmarketAmountWrapper>
        </CoinmarketAmountContainer>
    );
};

export default CoinmarketFormOfferCryptoAmount;
