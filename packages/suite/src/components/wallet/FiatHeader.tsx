import { HiddenPlaceholder } from '@suite/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectFiatFromCryptoValue } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type AmountUnit, BASE_CURRENCY_ZERO } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { BigAmountValue } from './BigAmountValue';
import { useSelector } from '../../hooks/suite/useSelector';

type FiatHeaderProps = {
    amount: string | AmountUnit; // Todo: `string` only for back compatibility
    symbol?: NetworkSymbol;
    size: 'large' | 'medium';
    localCurrency: string;
    'data-testid'?: string;
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
    const convertedFiatAmount = useSelector(state =>
        symbol ? selectFiatFromCryptoValue(state, amount, symbol) : null,
    );
    const fiatAmount = symbol ? convertedFiatAmount : asBaseCurrencyAmount(new BigNumber(amount));
    const { BaseCurrencyAmountFormatter } = useFormatters();

    // `.format` rather than calling the formatter component and unpacking the element it returns:
    // the component body reads the discreet-mode context, and calling it inlines that read into this
    // render, where the React Compiler caches it behind a guard of values that never change while the
    // user hovers. `BigAmountValue` does the redaction itself from a live context read, so the string
    // wanted here is the unredacted one.
    const formattedFiatAmount =
        BaseCurrencyAmountFormatter.format(fiatAmount ?? BASE_CURRENCY_ZERO, {
            currency: localCurrency,
        }) ?? '';

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
