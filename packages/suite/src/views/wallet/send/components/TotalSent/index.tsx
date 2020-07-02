import React from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';
import { Card, Translation } from '@suite-components';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: row;
    justify-items: space-between;
    align-items: center;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Label = styled.div`
    padding-right: 10px;
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const SecondaryLabel = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    flex-direction: column;
    align-items: flex-end;
`;

const CoinAmount = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    padding-bottom: 6px;
`;

const Fee = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

export default () => {
    return (
        <StyledCard>
            <Left>
                <Label>
                    <Translation id="TR_TOTAL_SENT" />
                </Label>
                <SecondaryLabel>
                    <Translation id="TR_INCLUDING_FEE" />
                </SecondaryLabel>
            </Left>
            <Right>
                <CoinAmount>0.15123512 BTC</CoinAmount>
                <Fee>103.22 USD</Fee>
            </Right>
        </StyledCard>
    );
};
