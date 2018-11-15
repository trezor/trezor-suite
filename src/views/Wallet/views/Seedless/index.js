import styled from 'styled-components';
import { H2 } from 'components/Heading';
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

const StyledParagraph = styled(Paragraph)`
    margin: 10px 50px;
    display: block;
    text-align: center;
`;

const Seedless = () => (
    <Wrapper>
        <Row>
            <H2>Device is in seedless mode</H2>
            <StyledParagraph>It&apos;s not suitable to use this service.</StyledParagraph>
        </Row>
    </Wrapper>
);

export default connect(null, null)(Seedless);
