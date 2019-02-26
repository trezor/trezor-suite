/* @flow */
import styled from 'styled-components';
import { H1 } from 'components/Heading';
import Button from 'components/Button';
import { getOldWalletUrl } from 'utils/url';
import Paragraph from 'components/Paragraph';
import React from 'react';
import { connect } from 'react-redux';

import type { TrezorDevice } from 'flowtype';

type Props = {
    device: ?TrezorDevice;
}

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

const A = styled.a``;

const StyledParagraph = styled(Paragraph)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const Initialize = (props: Props) => (
    <Wrapper data-test="Page__device__not__initialized">
        <Row>
            <H1>Your device is not initialized</H1>
            <StyledParagraph>Please use Bitcoin wallet interface to start initialization process</StyledParagraph>
            <A href={getOldWalletUrl(props.device)}>
                <Button>Take me to the Bitcoin wallet</Button>
            </A>
        </Row>
    </Wrapper>
);

export default connect(null, null)(Initialize);
