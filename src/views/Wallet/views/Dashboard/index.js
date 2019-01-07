import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import Content from 'views/Wallet/components/Content';

import { H1 } from 'components/Heading';
import Paragraph from 'components/Paragraph';
import DashboardImg from 'images/dashboard.png';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div`
    flex: 1;
    display: flex;
    padding: 100px 48px;
    
    flex-direction: column;
    align-items: center;
`;

const StyledP = styled(Paragraph)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const Dashboard = () => (
    <Content>
        <Wrapper>
            <Row>
                <H1>Please select your coin</H1>
                <StyledP>You will gain access to receiving &amp; sending selected coin</StyledP>
                <img src={DashboardImg} height="34" width="auto" alt="Dashboard" />
            </Row>
        </Wrapper>
    </Content>
);

export default connect(null, null)(Dashboard);
