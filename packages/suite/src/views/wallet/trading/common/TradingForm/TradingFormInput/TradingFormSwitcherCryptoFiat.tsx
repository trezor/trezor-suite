import { TextButton } from '@trezor/components';

import { Translation } from 'src/components/suite';

interface TradingFormSwitcherCryptoFiatProps {
    // displaySymbol or fiat currency
    currency?: string;
    isDisabled: boolean;
    toggleAmountInCrypto: () => void;
}

export const TradingFormSwitcherCryptoFiat = ({
    currency,
    isDisabled,
    toggleAmountInCrypto,
}: TradingFormSwitcherCryptoFiatProps) => (
    <TextButton
        data-testid="@trading/form/switch-crypto-fiat"
        size="small"
        onClick={() => {
            toggleAmountInCrypto();
        }}
        type="button"
        isDisabled={isDisabled}
    >
        <Translation
            id="TR_TRADING_ENTER_AMOUNT_IN"
            values={{
                currency,
            }}
        />
    </TextButton>
);
