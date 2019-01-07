import styled from 'styled-components';
import { H1 } from 'components/Heading';
import Paragraph from 'components/Paragraph';
import Content from 'views/Wallet/components/Content';
import React from 'react';
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

const StyledParagraph = styled(Paragraph)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const Seedless = () => (
    <Content>
        <Wrapper>
            <Row>
                <H1>Device is in seedless mode</H1>
                <StyledParagraph>It&apos;s not suitable to use this service.</StyledParagraph>
            </Row>
        </Wrapper>
    </Content>
);

export default connect(null, null)(Seedless);
