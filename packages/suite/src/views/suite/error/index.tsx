import React from 'react';
import styled from 'styled-components';
import { Translation, Image } from '@suite-components';
import messages from '@suite/support/messages';
import { P, H1, Button, Link } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    width: 100%;
    flex-direction: column;
`;

export default () => {
    return (
        <Wrapper>
            <H1>
                <Translation {...messages.TR_404_TITLE} />
            </H1>
            <P size="tiny">
                <Translation {...messages.TR_404_DESCRIPTION} />
            </P>
            <Image image="404" />
            <Link target="_self" href="/">
                <Button>
                    <Translation {...messages.TR_404_GO_TO_DASHBOARD} />
                </Button>
            </Link>
        </Wrapper>
    );
};
