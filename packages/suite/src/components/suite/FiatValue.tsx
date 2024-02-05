import { ReactElement } from 'react';
import styled from 'styled-components';
import { selectCoinsLegacy } from '@suite-common/wallet-core';
import { HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { Network } from 'src/types/wallet';
import { TimestampedRates } from 'src/types/wallet/fiatRates';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import type { FormatNumberOptions } from '@formatjs/intl';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

const StyledHiddenPlaceholder = styled(props => <HiddenPlaceholder {...props} />)`
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

interface CommonOwnProps {
    amount: string;
    symbol: Network['symbol'] | string;
    tokenAddress?: string;
    fiatCurrency?: string;
    children?: (props: Params) => ReactElement | null;
    showApproximationIndicator?: boolean;
    disableHiddenPlaceholder?: boolean;
    fiatAmountFormatterOptions?: FormatNumberOptions;
    shouldConvert?: boolean;
}

interface DefaultSourceProps extends CommonOwnProps {
    source?: never;
    useCustomSource?: never;
}

interface CustomSourceProps extends CommonOwnProps {
    source: TimestampedRates['rates'] | undefined | null;
    useCustomSource: boolean;
}

type FiatValueProps = (DefaultSourceProps | CustomSourceProps) & { className?: string };

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
    const { FiatAmountFormatter } = useFormatters();
    const localCurrency = useSelector(selectLocalCurrency);
    const coins = useSelector(selectCoinsLegacy);

    const targetCurrency = fiatCurrency ?? localCurrency;
    const currentFiatRates = coins.find(f =>
        tokenAddress
            ? f.tokenAddress?.toLowerCase() === tokenAddress?.toLowerCase()
            : f.symbol.toLowerCase() === symbol.toLowerCase(),
    )?.current;

    const ratesSource = useCustomSource ? source : currentFiatRates?.rates;
    let fiatAmount: string | null = amount;
    if (shouldConvert) {
        fiatAmount = ratesSource ? toFiatCurrency(amount, targetCurrency, ratesSource) : null;
    }
    const WrapperComponent = disableHiddenPlaceholder ? SameWidthNums : StyledHiddenPlaceholder;
    if (fiatAmount) {
        const fiatValueComponent = (
            <WrapperComponent className={className}>
                {showApproximationIndicator && <>≈ </>}
                <FiatAmountFormatter
                    currency={targetCurrency.toUpperCase()}
                    value={fiatAmount}
                    {...fiatAmountFormatterOptions}
                />
            </WrapperComponent>
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
            timestamp: useCustomSource ? null : currentFiatRates?.ts ?? null,
        });
    }
    if (!children) return null;
    return children({ value: null, rate: null, timestamp: null });
};
