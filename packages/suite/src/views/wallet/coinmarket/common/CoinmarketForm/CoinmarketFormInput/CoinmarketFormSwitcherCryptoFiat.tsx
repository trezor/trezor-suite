import { TextButton } from '@trezor/components';
import { Translation } from 'src/components/suite';

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
    <TextButton
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
    </TextButton>
);

export default CoinmarketFormSwitcherCryptoFiat;
