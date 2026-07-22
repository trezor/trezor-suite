import { useFormatters } from '@suite-common/formatters';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type AmountUnit, BASE_CURRENCY_ZERO } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite';

import { BigAmountValue } from './BigAmountValue';
import { useFiatFromCryptoValue } from '../../hooks/suite/useFiatFromCryptoValue';

type UseFiatAmountProps = {
    amount: string | AmountUnit; // Todo: `string` only for back compatibility
    symbol?: NetworkSymbol;
};

type FiatHeaderProps = {
    size: 'large' | 'medium';
    localCurrency: string;
    'data-testid'?: string;
} & UseFiatAmountProps;

const useFiatAmount = ({ amount, symbol }: UseFiatAmountProps) => {
    const { fiatAmount } = useFiatFromCryptoValue({
        amount,
        symbol: symbol ?? 'btc',
    });

    if (!symbol) {
        return asBaseCurrencyAmount(new BigNumber(amount));
    }

    return fiatAmount;
};

/**
 * If `symbol` is not provided, `amount` is returned as is, otherwise it is converted to fiat currency.
 */
const FiatHeaderContent = ({
    amount,
    symbol,
    size,
    localCurrency,
    'data-testid': dataTestId,
}: FiatHeaderProps) => {
    const fiatAmount = useFiatAmount({ amount, symbol });
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const formattedAmount = BaseCurrencyAmountFormatter({
        value: fiatAmount ?? BASE_CURRENCY_ZERO,
        currency: localCurrency,
    });

    const formattedFiatAmount = formattedAmount?.props.children;

    return (
        <BigAmountValue
            formattedStringAmount={formattedFiatAmount}
            data-testid={dataTestId}
            size={size}
        />
    );
};

export const FiatHeader = (props: FiatHeaderProps) => (
    <HiddenPlaceholder enforceIntensity={10}>
        <FiatHeaderContent {...props} />
    </HiddenPlaceholder>
);
