import { CoinmarketOffersItemProps } from '../CoinmarketOffers/CoinmarketOffersItem';
import styled from 'styled-components';
import { typography } from '@trezor/theme';

const TooltipRow = styled.div`
    display: flex;
    justify-content: space-between;
    min-width: 129px;
`;

const TooltipProperty = styled.div`
    ${typography.hint};
    width: 70%;
`;

const TooltipValue = styled.div`
    ${typography.hint};
    text-align: right;
`;

// IN TESTING MODE
const CoinmarketUtilsTooltipFee = (_props: Pick<CoinmarketOffersItemProps, 'quote'>) => {
    return (
        <>
            <TooltipRow>
                <TooltipProperty>Network fee:</TooltipProperty>
                <TooltipValue>$2.0</TooltipValue>
            </TooltipRow>
            <TooltipRow>
                <TooltipProperty>Trade fee:</TooltipProperty>
                <TooltipValue>$1.5</TooltipValue>
            </TooltipRow>
        </>
    );
};

export default CoinmarketUtilsTooltipFee;
