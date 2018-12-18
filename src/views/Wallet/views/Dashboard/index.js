import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import Content from 'views/Wallet/components/Content';

import { H2 } from 'components/Heading';
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

const P = styled.p`
    padding: 24px 0px;
    text-align: center;
`;

const Dashboard = () => (
    <Content>
        <Wrapper>
            <H2>Dashboard</H2>
            <Row>
                <H2>Please select your coin</H2>
                <P>You will gain access to receiving &amp; sending selected coin</P>
                <img src={DashboardImg} height="34" width="auto" alt="Dashboard" />
            </Row>
        </Wrapper>
    </Content>
);

export default connect(null, null)(Dashboard);
