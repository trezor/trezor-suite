import { FormattedCryptoAmount } from 'src/components/suite';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { Tooltip, variables } from '@trezor/components';
import BigNumber from 'bignumber.js';

const StyledFormattedCryptoAmount = styled(FormattedCryptoAmount)<{
    $isRewards?: boolean;
    $isSmall?: boolean;
}>`
    display: block;
    margin-top: ${spacingsPx.xs};
    font-size: ${({ $isSmall }) => ($isSmall ? variables.FONT_SIZE.SMALL : variables.FONT_SIZE.H2)};
    color: ${({ $isRewards = false, theme }) => ($isRewards ? theme.textPrimaryDefault : '')};
`;

const DEFAULT_MAX_DECIMAL_PLACES = 5;

interface TrimmedCryptoAmountProps {
    value: string | number;
    symbol: string;
    maxDecimalPlaces?: number;
    isRewards?: boolean;
}

export const TrimmedCryptoAmount = ({
    value,
    symbol,
    maxDecimalPlaces = DEFAULT_MAX_DECIMAL_PLACES,
    isRewards,
}: TrimmedCryptoAmountProps) => {
    const hasDecimals = value.toString().includes('.');

    if (!hasDecimals) {
        return <StyledFormattedCryptoAmount value={value} symbol={symbol} $isRewards={isRewards} />;
    }

    const valueBig = new BigNumber(value);
    const trimmedAmount = valueBig.toFixed(maxDecimalPlaces, 1);

    return (
        <Tooltip content={<StyledFormattedCryptoAmount value={value} symbol={symbol} $isSmall />}>
            <StyledFormattedCryptoAmount
                value={trimmedAmount}
                symbol={symbol}
                $isRewards={isRewards}
            />
        </Tooltip>
    );
};
