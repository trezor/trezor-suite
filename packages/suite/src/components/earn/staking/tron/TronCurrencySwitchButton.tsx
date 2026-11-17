import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Rate } from '@suite-common/wallet-types';
import { TextButton } from '@trezor/components';

interface TronCurrencySwitchButtonProps {
    rate?: Rate;
    currency: 'crypto' | 'fiat';
    setCurrency: (currency: 'crypto' | 'fiat') => void;
    fiatCurrencySymbol: string;
    networkSymbol: NetworkSymbol;
}

export const TronCurrencySwitchButton = ({
    rate,
    currency,
    setCurrency,
    fiatCurrencySymbol,
    networkSymbol,
}: TronCurrencySwitchButtonProps) => {
    if (!rate?.rate) return null;

    const currencySymbol =
        currency === 'crypto' ? fiatCurrencySymbol : <AssetSymbol networkSymbol={networkSymbol} />;

    const onToggle = () => {
        const newCurrency = currency === 'crypto' ? 'fiat' : 'crypto';
        setCurrency(newCurrency);
    };

    return (
        <TextButton
            type="button"
            size="small"
            onClick={onToggle}
            data-testid="@staking/tron-form/currency-switch-button"
        >
            <Translation id="TR_ENTER_AMOUNT_IN" values={{ currency: currencySymbol }} />
        </TextButton>
    );
};
