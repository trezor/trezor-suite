import { useTheme } from 'styled-components';

import { AMOUNT_MAX_LENGTH } from '@suite-common/wallet-core';
import { NumberInputBase, type NumberInputBaseProps } from '@trezor/product-components';

import { getAmountInputStyle } from './amountInputStyle';

const AMOUNT_PLACEHOLDER = '0.0';

type AmountInputProps = Pick<
    NumberInputBaseProps,
    'value' | 'onChange' | 'locale' | 'hasError' | 'data-testid'
>;

export const AmountInput = ({
    value,
    onChange,
    locale,
    hasError,
    'data-testid': dataTestId,
}: AmountInputProps) => {
    const theme = useTheme();

    return (
        <NumberInputBase
            isClean
            placeholderColor="contentSecondary"
            flex="1"
            value={value}
            onChange={onChange}
            locale={locale}
            placeholder={AMOUNT_PLACEHOLDER}
            style={displayValue => ({
                ...getAmountInputStyle(displayValue),
                color: hasError ? theme.contentCritical : undefined,
            })}
            hasError={hasError}
            maxLength={AMOUNT_MAX_LENGTH}
            data-testid={dataTestId}
        />
    );
};
