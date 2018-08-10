import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';

import { H2 } from '~/js/components/common/Heading';
import DashboardImg from '~/images/dashboard.png';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const StyledH2 = styled(H2)`
    padding: 24px 48px;
`;

const Row = styled.div`
    flex: 1;
    display: flex;
    padding: 0px 48px;
    
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const P = styled.p`
    padding: 24px 0px;
    text-align: center;
`;

const Dashboard = () => (
    <Wrapper>
        <StyledH2>Dashboard</StyledH2>
        <Row>
            <H2>Please select your coin</H2>
            <P>You will gain access to recieving &amp; sending selected coin</P>
            <img src={DashboardImg} height="34" width="auto" alt="Dashboard" />
        </Row>
    </Wrapper>
);

export default connect(null, null)(Dashboard);
