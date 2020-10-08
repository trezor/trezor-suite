import React from 'react';
import BigNumber from 'bignumber.js';
import { FormattedNumber as FNumber } from 'react-intl';

// wrapper for react-intl/FormattedNumber
// FormattedNumber works with "number" values type also we want to handle Number.MAX_SAFE_INTEGER

type FNProps = React.ComponentProps<typeof FNumber>;
type Props = {
    value: string | number;
} & Omit<FNProps, 'value'>;

const FormattedNumber = (props: Props) => {
    const bn = new BigNumber(props.value);
    if (bn.gt(Number.MAX_SAFE_INTEGER)) {
        return (
            <span>
                {props.value} {props.currency}
            </span>
        );
    }
    return (
        <FNumber
            currency={props.currency}
            value={bn.toNumber()}
            minimumFractionDigits={props.minimumFractionDigits ?? 2}
            maximumFractionDigits={props.maximumFractionDigits ?? 2}
            style={props.style || 'currency'}
        />
    );
};

export default FormattedNumber;
