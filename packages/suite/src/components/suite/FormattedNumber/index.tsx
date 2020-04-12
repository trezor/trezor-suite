import React from 'react';
import BigNumber from 'bignumber.js';
import { FormattedNumber } from 'react-intl';

// wrapper for react-intl/FormattedNumber
// FormattedNumber works with "number" values type also we want to handle Number.MAX_SAFE_INTEGER

interface Props {
    currency: string;
    value: string | number;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    style?: string;
}

export default (props: Props) => {
    const bn = new BigNumber(props.value);
    if (bn.gt(Number.MAX_SAFE_INTEGER)) {
        return (
            <span>
                {props.value} {props.currency}
            </span>
        );
    }
    return (
        <FormattedNumber
            currency={props.currency}
            value={bn.toNumber()}
            minimumFractionDigits={props.minimumFractionDigits ?? 2}
            maximumFractionDigits={props.maximumFractionDigits ?? 2}
            style={props.style || 'currency'}
        />
    );
};
