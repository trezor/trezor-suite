import { Translation } from '@suite/intl';
import { type Rate } from '@suite-common/wallet-types';
import { TextButton } from '@trezor/components';

interface TronCurrencySwitchButtonProps {
    rate?: Rate;
    currency: 'crypto' | 'fiat';
    setCurrency: (currency: 'crypto' | 'fiat') => void;
    fiatCurrencySymbol: string;
    cryptoCurrencySymbol: string;
}

export const TronCurrencySwitchButton = ({
    rate,
    currency,
    setCurrency,
    fiatCurrencySymbol,
    cryptoCurrencySymbol,
}: TronCurrencySwitchButtonProps) => {
    if (!rate?.rate) return null;

    const currencySymbol = currency === 'crypto' ? cryptoCurrencySymbol : fiatCurrencySymbol;

    const onToggle = () => {
        const newCurrency = currency === 'crypto' ? 'fiat' : 'crypto';
        setCurrency(newCurrency);
    };

    return (
        <TextButton type="button" size="small" onClick={onToggle}>
            <Translation id="TR_EARN_ENTER_AMOUNT_IN" values={{ currency: currencySymbol }} />
        </TextButton>
    );
};
