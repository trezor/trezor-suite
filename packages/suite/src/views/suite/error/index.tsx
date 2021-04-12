import React from 'react';
import styled from 'styled-components';
import { Translation, Image } from '@suite-components';

import { P, H1, Button, Link } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    width: 100%;
    flex-direction: column;
    margin-top: 160px;
`;

const ErrorPage = () => (
    <Wrapper>
        <H1>
            <Translation id="TR_404_TITLE" />
        </H1>
        <P size="tiny">
            <Translation id="TR_404_DESCRIPTION" />
        </P>
        <Image image="404" />
        <Link variant="nostyle" target="_self" href="/">
            <Button>
                <Translation id="TR_404_GO_TO_DASHBOARD" />
            </Button>
        </Link>
    </Wrapper>
);

export default ErrorPage;
