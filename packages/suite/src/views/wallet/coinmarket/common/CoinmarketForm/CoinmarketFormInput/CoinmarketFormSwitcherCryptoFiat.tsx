import { Translation } from 'src/components/suite';
import { CoinmarketTextButton } from 'src/views/wallet/coinmarket';

interface CoinmarketFormSwitcherCryptoFiatProps {
    symbol: string;
    isDisabled: boolean;
    toggleWantCrypto: () => void;
}

const CoinmarketFormSwitcherCryptoFiat = ({
    symbol,
    isDisabled,
    toggleWantCrypto,
}: CoinmarketFormSwitcherCryptoFiatProps) => (
    <CoinmarketTextButton
        size="small"
        onClick={() => {
            toggleWantCrypto();
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
