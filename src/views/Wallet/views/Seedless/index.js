import styled from 'styled-components';
import { H1 } from 'components/Heading';
import Paragraph from 'components/Paragraph';
import React from 'react';
import { connect } from 'react-redux';


const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 40px 35px 40px 35px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px 0;
`;

const StyledParagraph = styled(Paragraph)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const Seedless = () => (
    <Wrapper>
        <Row>
            <H1>Device is in seedless mode</H1>
            <StyledParagraph>It&apos;s not suitable to use this service.</StyledParagraph>
        </Row>
    </Wrapper>
);

export default connect(null, null)(Seedless);
