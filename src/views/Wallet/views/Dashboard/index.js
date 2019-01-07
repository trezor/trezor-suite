import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import Content from 'views/Wallet/components/Content';

import EthIcon from 'images/coins/eth.png';
import RippleIcon from 'images/coins/xrp.png';

import { H2 } from 'components/Heading';

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

const Overlay = styled.div`
    display: flex;
    width: 100%;
    height: 40px;
    justify-content: center;
    align-items: center;
    opacity: 0.2;
    background: white;
`;

const Image = styled.img``;

const EthImage = styled(Image)`
    margin-right: 10px;
`;

const Dashboard = () => (
    <Content>
        <Wrapper>
            <H2>Dashboard</H2>
            <Row>
                <H2>Please select your coin</H2>
                <P>You will gain access to receiving &amp; sending selected coin</P>
                <Overlay>
                    <EthImage src={EthIcon} width={20} />
                    <Image src={RippleIcon} width={25} />
                </Overlay>
            </Row>
        </Wrapper>
    </Content>
);

export default connect(null, null)(Dashboard);
