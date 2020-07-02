import React from 'react';
import styled from 'styled-components';
import { SelectBar, colors, variables } from '@trezor/components';
import { Card, Translation } from '@suite-components';

const StyledCard = styled(Card)`
    display: flex;
    margin-bottom: 25px;
    flex-direction: row;
    justify-items: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
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

const FiatAmount = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

export default () => {
    return (
        <StyledCard>
            <Left>
                <SelectBar
                    label={<Translation id="TR_FEE" />}
                    options={[
                        { label: 'low', value: 'low' },
                        { label: 'medium', value: 'medium' },
                        { label: 'high', value: 'high' },
                        { label: 'custom', value: 'custom' },
                    ]}
                />
            </Left>
            <Right>
                <CoinAmount>123123123 BTC</CoinAmount>
                <FiatAmount>103.22 USD</FiatAmount>
            </Right>
        </StyledCard>
    );
};
