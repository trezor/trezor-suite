import { TextButton } from '@trezor/components';

import { Translation } from 'src/components/suite';

interface CoinmarketFormSwitcherCryptoFiatProps {
    // displaySymbol or fiat currency
    currency?: string;
    isDisabled: boolean;
    toggleAmountInCrypto: () => void;
}

export const CoinmarketFormSwitcherCryptoFiat = ({
    currency,
    isDisabled,
    toggleAmountInCrypto,
}: CoinmarketFormSwitcherCryptoFiatProps) => (
    <TextButton
        data-testid="@coinmarket/form/switch-crypto-fiat"
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
                currency,
            }}
        />
    </TextButton>
);
