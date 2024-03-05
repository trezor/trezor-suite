import { ReactElement } from 'react';
import styled from 'styled-components';
import { useFormatters } from '@suite-common/formatters';
import type { FormatNumberOptions } from '@formatjs/intl';
import {
    useFiatFromCryptoValue,
    useFiatFromCryptoValueParams,
} from 'src/hooks/suite/useFiatFromCryptoValue';
import { HiddenPlaceholder } from './HiddenPlaceholder';

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    font-variant-numeric: tabular-nums;
`;

const SameWidthNums = styled.span`
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
    shouldConvert?: boolean;
    className?: string;
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
    fiatCurrency,
    source,
    useCustomSource,
    showApproximationIndicator,
    disableHiddenPlaceholder,
    fiatAmountFormatterOptions,
    shouldConvert = true,
}: FiatValueProps) => {
    const { targetCurrency, fiatAmount, ratesSource, currentRate } = useFiatFromCryptoValue({
        amount,
        symbol,
        tokenAddress,
        fiatCurrency,
        source,
        useCustomSource,
    });

    const { FiatAmountFormatter } = useFormatters();
    const value = shouldConvert ? fiatAmount : amount;

    if (value) {
        const fiatValueContent = (
            <>
                {showApproximationIndicator && <>≈ </>}
                <FiatAmountFormatter
                    currency={targetCurrency.toUpperCase()}
                    value={value}
                    {...fiatAmountFormatterOptions}
                />
            </>
        );
        const fiatValueComponent = disableHiddenPlaceholder ? (
            <SameWidthNums className={className}>{fiatValueContent}</SameWidthNums>
        ) : (
            <StyledHiddenPlaceholder className={className}>
                {fiatValueContent}
            </StyledHiddenPlaceholder>
        );

        const fiatRateValue = ratesSource?.[targetCurrency] ?? null;
        const fiatRateComponent = fiatRateValue ? (
            <SameWidthNums>
                <FiatAmountFormatter currency={targetCurrency} value={fiatRateValue} />
            </SameWidthNums>
        ) : null;
        if (!children) return fiatValueComponent;

        return children({
            value: fiatValueComponent,
            rate: fiatRateComponent,
            timestamp: useCustomSource ? null : currentRate?.lastTickerTimestamp ?? null,
        });
    }
    if (!children) return null;

    return children({ value: null, rate: null, timestamp: null });
};
