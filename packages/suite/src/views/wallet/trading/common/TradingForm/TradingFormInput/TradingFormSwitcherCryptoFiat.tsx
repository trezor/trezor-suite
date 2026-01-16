import { Translation } from '@suite/intl';
import { TextButton } from '@trezor/components';

interface TradingFormSwitcherCryptoFiatProps {
    // displaySymbol or fiat currency
    currency?: string;
    isDisabled?: boolean;
    toggleAmountInCrypto: () => void;
}

export const TradingFormSwitcherCryptoFiat = ({
    currency,
    isDisabled = false,
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
