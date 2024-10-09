import { FormattedCryptoAmount } from 'src/components/suite';
import styled from 'styled-components';
import { Tooltip, variables } from '@trezor/components';
import { BigNumber } from '@trezor/utils/src/bigNumber';

const StyledFormattedCryptoAmount = styled(FormattedCryptoAmount)`
    display: block;
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

interface ApproximateEthAmountProps {
    value: string | number;
    symbol: string;
}

const DEFAULT_MAX_DECIMAL_PLACES = 5;

export const ApproximateEthAmount = ({ value, symbol }: ApproximateEthAmountProps) => {
    const hasDecimals = value.toString().includes('.');

    if (!hasDecimals) {
        return <StyledFormattedCryptoAmount value={value} symbol={symbol} />;
    }

    const valueBig = new BigNumber(value);
    const trimmedAmount = valueBig.toFixed(DEFAULT_MAX_DECIMAL_PLACES, 1);

    return (
        <Tooltip content={<StyledFormattedCryptoAmount value={value} symbol={symbol} />}>
            <StyledFormattedCryptoAmount value={trimmedAmount} symbol={symbol} />
        </Tooltip>
    );
};
