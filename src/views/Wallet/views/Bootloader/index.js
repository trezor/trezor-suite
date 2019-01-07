import React from 'react';
import styled from 'styled-components';
import { H2 } from 'components/Heading';
import { connect } from 'react-redux';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 100px 48px;
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
