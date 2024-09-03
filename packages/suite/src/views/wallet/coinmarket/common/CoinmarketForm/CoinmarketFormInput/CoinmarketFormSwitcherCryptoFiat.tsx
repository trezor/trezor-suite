import { Translation } from 'src/components/suite';
import { CoinmarketTextButton } from 'src/views/wallet/coinmarket';

interface CoinmarketFormSwitcherCryptoFiatProps {
    symbol?: string;
    isDisabled: boolean;
    toggleAmountInCrypto: () => void;
}

const CoinmarketFormSwitcherCryptoFiat = ({
    symbol,
    isDisabled,
    toggleAmountInCrypto,
}: CoinmarketFormSwitcherCryptoFiatProps) => (
    <CoinmarketTextButton
        size="small"
        onClick={() => {
            toggleAmountInCrypto();
        }}
        type="button"
        isDisabled={isDisabled}
    >
        <Translation
            id="TR_COINMARKET_ENTER_AMOUNT_IN"
            values={{
                currency: symbol,
            }}
        />
    </CoinmarketTextButton>
);

export default CoinmarketFormSwitcherCryptoFiat;
