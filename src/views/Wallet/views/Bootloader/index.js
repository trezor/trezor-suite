import React from 'react';
import styled from 'styled-components';
import { H2 } from 'components/Heading';
import { connect } from 'react-redux';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
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
    padding: 10px 0px;
    text-align: center;
`;

const Bootloader = () => (
    <Wrapper>
        <Row>
            <H2>Your device is in firmware update mode</H2>
            <P>Please re-connect it</P>
        </Row>
    </Wrapper>
);

export default connect(null, null)(Bootloader);
