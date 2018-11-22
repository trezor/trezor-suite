import styled from 'styled-components';
import { H2 } from 'components/Heading';
import Button from 'components/Button';
import Paragraph from 'components/Paragraph';
import React from 'react';
import { connect } from 'react-redux';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const A = styled.a``;

const StyledParagraph = styled(Paragraph)`
    margin: 10px 50px;
    display: block;
    text-align: center;
`;

const Initialize = () => (
    <Wrapper>
        <Row>
            <H2>Your device is in not initialized</H2>
            <StyledParagraph>Please use Bitcoin wallet interface to start initialization process</StyledParagraph>
            <A href="https://beta-wallet.trezor.io/">
                <Button>Take me to the Bitcoin wallet</Button>
            </A>
        </Row>
    </Wrapper>
);

export default connect(null, null)(Initialize);
