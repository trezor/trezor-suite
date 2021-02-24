import React from 'react';
import styled from 'styled-components';
import { HiddenPlaceholder } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { Network } from '@wallet-types';
import { TimestampedRates } from '@wallet-types/fiatRates';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';

import FormattedNumber from '../FormattedNumber';

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
    children?: (props: Params) => React.ReactElement | null;
    showApproximationIndicator?: boolean;
    disableHiddenPlaceholder?: boolean;
}

interface DefaultSourceProps extends CommonOwnProps {
    source?: never;
    useCustomSource?: never;
}

interface CustomSourceProps extends CommonOwnProps {
    source: TimestampedRates['rates'] | undefined | null;
    useCustomSource: boolean;
}

type Props = DefaultSourceProps | CustomSourceProps;

/**
 * If used without children prop it returns a value of an crypto assets in fiat currency.
 * If prop `fiatCurrency` is not specified, the currency is read from suite settings.
 * null is returned if there was some problem with conversion (eg. missing rates)
 *
 * Advanced usage is with passing a function as a children prop.
 * The function will be called (and rendered) with 1 object param: {fiatValue, fiatRateValue, fiatRateTimestamp}.
 *
 *  In case of custom source of fiat rates returned timestamp is always null;
 * @param {Props} { amount, symbol, fiatCurrency, ...props }
 * @returns
 */
const FiatValue = ({
    children,
    amount,
    symbol,
    tokenAddress,
    fiatCurrency,
    source,
    useCustomSource,
    showApproximationIndicator,
    disableHiddenPlaceholder,
}: Props) => {
    const { fiat, settings } = useSelector(state => ({
        fiat: state.wallet.fiat,
        settings: state.wallet.settings,
    }));

    const targetCurrency = fiatCurrency ?? settings.localCurrency;
    const currentFiatRates = fiat.coins.find(
        f =>
            f.symbol.toLowerCase() === symbol.toLowerCase() &&
            f.tokenAddress?.toLowerCase() === tokenAddress?.toLowerCase(),
    )?.current;

    const ratesSource = useCustomSource ? source : currentFiatRates?.rates;
    const fiatAmount = ratesSource ? toFiatCurrency(amount, targetCurrency, ratesSource) : null;
    const WrapperComponent = disableHiddenPlaceholder ? SameWidthNums : StyledHiddenPlaceholder;
    if (fiatAmount) {
        const fiatValueComponent = (
            <WrapperComponent>
                {showApproximationIndicator && <>≈ </>}
                <FormattedNumber currency={targetCurrency} value={fiatAmount} />
            </WrapperComponent>
        );

        const fiatRateValue = ratesSource?.[targetCurrency] ?? null;
        const fiatRateComponent = fiatRateValue ? (
            <SameWidthNums>
                <FormattedNumber currency={targetCurrency} value={fiatRateValue} />
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

export default FiatValue;
