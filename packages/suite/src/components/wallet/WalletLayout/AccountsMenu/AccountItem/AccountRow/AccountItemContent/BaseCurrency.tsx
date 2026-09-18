import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { selectIsDiscreteModeActive } from '@suite-common/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAreSatsAmountUnit,
    selectBaseCurrency,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { valuablesBaseCurrencyCodes } from '@trezor/blockchain-link-types';
import { Skeleton, TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';
import { isArrayMember } from '@trezor/utils';

import { BaseCurrencyValue, HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

type BaseCurrencyProps = {
    isLoading?: boolean;
    symbol: NetworkSymbol;
    customFiatValue?: BaseCurrencyAmount;
    formattedBalance: string;
};

export const BaseCurrency = ({
    isLoading,
    symbol,
    customFiatValue,
    formattedBalance,
}: BaseCurrencyProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);
    const isBtcAmountInSats = useSelector(selectAreSatsAmountUnit);
    const isDiscreetModeActive = useSelector(selectIsDiscreteModeActive);

    // This is special case, here is Account list we have a little space, so we never show
    // decimal places for fiat currencies (fiat always have 2 or 3 decimal places),
    // where subunits are insignificant (little value).
    //
    // But we want to show decimal places for crypto (BTC) base currencies as they usually
    // have very significant subunits.
    const isBitcoinInSats = baseCurrencyCode === 'btc' && isBtcAmountInSats;

    const forceZeroDecimalPlaces =
        !isBitcoinInSats && !isArrayMember(baseCurrencyCode, valuablesBaseCurrencyCodes);

    return shallDisplayBaseCurrency && customFiatValue !== undefined ? (
        <HiddenPlaceholder>
            {isLoading ? (
                <Skeleton animate={shouldAnimate} />
            ) : (
                <BaseCurrencyAmountFormatter
                    value={customFiatValue}
                    currency={baseCurrencyCode}
                    {...(forceZeroDecimalPlaces
                        ? {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                          }
                        : {})}
                />
            )}
        </HiddenPlaceholder>
    ) : (
        <BaseCurrencyValue
            amount={formattedBalance}
            symbol={symbol}
            fiatAmountFormatterOptions={
                forceZeroDecimalPlaces
                    ? {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                      }
                    : undefined
            }
        >
            {/* Called by `BaseCurrencyValue`, not rendered as an element, so this must not use
                hooks: the React Compiler caches the call, and a cache hit would drop the hooks
                from the render, crashing with "Rendered fewer hooks than expected". */}
            {({ value }) =>
                isDiscreetModeActive || value === null ? (
                    value
                ) : (
                    <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                        {value}
                    </TruncateWithTooltip>
                )
            }
        </BaseCurrencyValue>
    );
};
