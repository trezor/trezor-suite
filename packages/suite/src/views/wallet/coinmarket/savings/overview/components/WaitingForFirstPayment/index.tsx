import React from 'react';
import styled from 'styled-components';
import { Card, Translation } from '@suite-components';

const StyledCard = styled(Card)`
    background: rgba(239, 201, 65, 0.1);
    color: #ba9924;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    justify-content: center;
`;

const Header = styled.div`
    font-size: 16px;
    line-height: 28px;
`;
const Description = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: 14px;
    line-height: 18px;
`;

const WaitingForFirstPayment = () => (
    <StyledCard>
        <div>
            <Header>
                <Translation id="TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_PAYMENT_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_OVERVIEW_WAITING_FOR_FIRST_PAYMENT_DESCRIPTION" />
            </Description>
        </div>
    </StyledCard>
);
export default WaitingForFirstPayment;
