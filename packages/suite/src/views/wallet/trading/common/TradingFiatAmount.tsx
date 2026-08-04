import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';

import { HiddenPlaceholder } from 'src/components/suite';

interface TradingFiatAmountProps {
    amount?: BaseCurrencyAmount;
    currency?: string;
    disableHiddenPlaceholder?: boolean;
}

export const TradingFiatAmount = ({
    amount,
    currency,
    disableHiddenPlaceholder,
}: TradingFiatAmountProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const formatterOptions =
        currency && isFiatBaseCurrencyCode(currency)
            ? {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: getDecimalsForBaseCurrency({
                      ...networkConfigDeps,
                      code: currency,
                      isInSats: false,
                  }),
              }
            : undefined;

    const content =
        amount !== undefined ? (
            <BaseCurrencyAmountFormatter value={amount} currency={currency} {...formatterOptions} />
        ) : (
            <>{currency?.toUpperCase()}</>
        );

    if (disableHiddenPlaceholder) {
        return content;
    }

    return <HiddenPlaceholder>{content}</HiddenPlaceholder>;
};
