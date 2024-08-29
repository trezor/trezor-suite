import { ReactElement } from 'react';
import styled from 'styled-components';
import { HiddenPlaceholder } from 'src/components/suite';
import { useFormatters } from '@suite-common/formatters';
import type { FormatNumberOptions } from '@formatjs/intl';
import {
    useFiatFromCryptoValue,
    useFiatFromCryptoValueParams,
} from 'src/hooks/suite/useFiatFromCryptoValue';
import { HiddenPlaceholderProps } from './HiddenPlaceholder';
import { useLoadingSkeleton, useSelector } from 'src/hooks/suite';
import { SkeletonRectangle } from '@trezor/components';
import { selectIsSpecificCoinDefinitionKnown } from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';

const StyledHiddenPlaceholder = styled((props: HiddenPlaceholderProps) => (
    <HiddenPlaceholder {...props} />
))`
    font-variant-numeric: tabular-nums;
`;

// Do NOT use any prop from <HiddenPlaceholderProps>, its here just to fix types
const SameWidthNums = styled.span<HiddenPlaceholderProps>`
    font-variant-numeric: tabular-nums;
`;

interface Params {
    value: JSX.Element | null;
    rate: JSX.Element | null;
    timestamp: number | null;
}

type FiatValueProps = useFiatFromCryptoValueParams & {
    children?: (props: Params) => ReactElement | null;
    showApproximationIndicator?: boolean;
    disableHiddenPlaceholder?: boolean;
    fiatAmountFormatterOptions?: FormatNumberOptions;
    fiatRateFormatterOptions?: FormatNumberOptions;
    shouldConvert?: boolean;
    showLoadingSkeleton?: boolean;
    className?: string;
    isLoading?: boolean;
};

/**
 * If used without children prop it returns a value of an crypto assets in fiat currency.
 * If prop `fiatCurrency` is not specified, the currency is read from suite settings.
 * null is returned if there was some problem with conversion (eg. missing rates)
 *
 * Advanced usage is with passing a function as a children prop.
 * The function will be called (and rendered) with 1 object param: {fiatValue, fiatRateValue, fiatRateTimestamp}.
 *
 *  In case of custom source of fiat rates returned timestamp is always null;
 * @param {FiatValuePropsProps} { amount, symbol, fiatCurrency, ...props }
 * @returns
 */
export const FiatValue = ({
    children,
    amount, // expects a value in full units (BTC not sats)
    className,
    symbol,
    tokenAddress,
    historicRate,
    useHistoricRate,
    showApproximationIndicator,
    disableHiddenPlaceholder,
    fiatAmountFormatterOptions,
    fiatRateFormatterOptions,
    shouldConvert = true,
    showLoadingSkeleton,
    isLoading,
}: FiatValueProps) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const { localCurrency, fiatAmount, rate, currentRate } = useFiatFromCryptoValue({
        amount,
        symbol,
        tokenAddress,
        historicRate,
        useHistoricRate,
    });

    const { FiatAmountFormatter } = useFormatters();
    const value = shouldConvert ? fiatAmount : amount;

    const WrapperComponent = disableHiddenPlaceholder ? SameWidthNums : StyledHiddenPlaceholder;

    const isTokenKnown = useSelector(state =>
        selectIsSpecificCoinDefinitionKnown(
            state,
            symbol as NetworkSymbol,
            tokenAddress || ('' as TokenAddress),
        ),
    );

    if (
        (!rate || !value || !currentRate?.lastTickerTimestamp || isLoading) &&
        showLoadingSkeleton &&
        !currentRate?.error &&
        isTokenKnown
    ) {
        return <SkeletonRectangle animate={shouldAnimate} />;
    }

    if (value) {
        const fiatValueComponent = (
            <WrapperComponent className={className}>
                {showApproximationIndicator && <>≈ </>}
                <FiatAmountFormatter
                    currency={localCurrency.toUpperCase()}
                    value={value}
                    {...fiatAmountFormatterOptions}
                />
            </WrapperComponent>
        );

        const fiatRateComponent = rate ? (
            <SameWidthNums>
                <FiatAmountFormatter
                    currency={localCurrency}
                    value={rate}
                    {...fiatRateFormatterOptions}
                />
            </SameWidthNums>
        ) : null;
        if (!children) return fiatValueComponent;

        return children({
            value: fiatValueComponent,
            rate: fiatRateComponent,
            timestamp: historicRate ? null : currentRate?.lastTickerTimestamp ?? null,
        });
    }
    if (!children) return null;

    return children({ value: null, rate: null, timestamp: null });
};
