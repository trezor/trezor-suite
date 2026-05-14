import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type TradingTradeType } from '@suite-common/trading';
import { typography } from '@trezor/theme';

const TooltipRow = styled.div`
    display: flex;
    justify-content: space-between;
    min-width: 129px;
`;

const TooltipProperty = styled.div`
    ${typography['body-sm']};
    width: 70%;
`;

const TooltipValue = styled.div`
    ${typography['body-sm']};
    text-align: right;
`;

// IN TESTING MODE
export const TradingUtilsTooltipFee = (_props: { quote: TradingTradeType }) => (
    <>
        <TooltipRow>
            <TooltipProperty>
                <Translation id="TR_TRADING_NETWORK_FEE" />:
            </TooltipProperty>
            <TooltipValue>$2.0</TooltipValue>
        </TooltipRow>
        <TooltipRow>
            <TooltipProperty>
                <Translation id="TR_TRADING_TRADE_FEE" />:
            </TooltipProperty>
            <TooltipValue>$1.5</TooltipValue>
        </TooltipRow>
    </>
);
