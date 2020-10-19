import React from 'react';
import { Props } from './Container';
import { Badge, HiddenPlaceholder } from '@suite-components';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import FormattedNumber from '../FormattedNumber';
import styled from 'styled-components';

const StyledHiddenPlaceholder = styled(props => <HiddenPlaceholder {...props} />)`
    font-variant-numeric: tabular-nums;
`;

const SameWidthNums = styled.span`
    font-variant-numeric: tabular-nums;
`;

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
    amount,
    symbol,
    fiatCurrency,
    source,
    useCustomSource,
    badge,
    showApproximationIndicator,
    disableHiddenPlaceholder,
    ...props
}: Props) => {
    const targetCurrency = fiatCurrency ?? props.settings.localCurrency;
    const currentFiatRates = props.fiat.coins.find(
        f => f.symbol.toLowerCase() === symbol.toLowerCase(),
    )?.current;

    const ratesSource = useCustomSource ? source : currentFiatRates?.rates;
    const fiat = ratesSource ? toFiatCurrency(amount, targetCurrency, ratesSource) : null;
    const WrapperComponent = disableHiddenPlaceholder ? SameWidthNums : StyledHiddenPlaceholder;
    if (fiat) {
        let fiatValueComponent = (
            <WrapperComponent>
                {showApproximationIndicator && <>≈ </>}
                <FormattedNumber currency={targetCurrency} value={fiat} />
            </WrapperComponent>
        );

        if (badge) {
            fiatValueComponent = (
                <WrapperComponent>
                    <Badge isGray={badge.color === 'gray'} isSmall={badge.size === 'small'}>
                        <FormattedNumber currency={targetCurrency} value={fiat} />
                    </Badge>
                </WrapperComponent>
            );
        }

        const fiatRateValue = ratesSource?.[targetCurrency] ?? null;
        const fiatRateComponent = fiatRateValue ? (
            <SameWidthNums>
                <FormattedNumber currency={targetCurrency} value={fiatRateValue} />
            </SameWidthNums>
        ) : null;
        if (!props.children) return fiatValueComponent;
        return props.children({
            value: fiatValueComponent,
            rate: fiatRateComponent,
            timestamp: useCustomSource ? null : currentFiatRates?.ts ?? null,
        });
    }
    if (!props.children) return null;
    return props.children({ value: null, rate: null, timestamp: null });
};

export default FiatValue;
