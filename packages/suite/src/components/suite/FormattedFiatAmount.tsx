import React from 'react';
import BigNumber from 'bignumber.js';
import { FormattedNumber as FNumber } from 'react-intl';

// wrapper for react-intl/FormattedNumber
// FormattedNumber works with "number" values type also we want to handle Number.MAX_SAFE_INTEGER

type FNProps = React.ComponentProps<typeof FNumber>;

type FormattedFiatAmountProps = {
    value: string | number;
    currency: string | undefined;
} & Omit<FNProps, 'value'>;

export const FormattedFiatAmount = ({
    value,
    currency,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    style,
    ...props
}: FormattedFiatAmountProps) => {
    const bn = new BigNumber(value);

    if (bn.isNaN()) {
        return null;
    }

    if (bn.gt(Number.MAX_SAFE_INTEGER)) {
        return (
            <span>
                {value} {currency}
            </span>
        );
    }

    return (
        <FNumber
            currency={currency}
            value={bn.toNumber()}
            minimumFractionDigits={minimumFractionDigits}
            maximumFractionDigits={maximumFractionDigits}
            style={style || 'currency'}
            {...props}
        />
    );
};
