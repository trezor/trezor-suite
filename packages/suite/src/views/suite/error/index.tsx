import React from 'react';
import styled from 'styled-components';
import { Translation, Link } from '@suite-components';
import messages from '@suite/support/messages';
import { P, H1, Button } from '@trezor/components-v2';
import { getRoute } from '@suite-utils/router';
import { resolveStaticPath } from '@suite-utils/nextjs';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    width: 100%;
    flex-direction: column;
`;

const Img = styled.img``;

export default () => {
    return (
        <Wrapper>
            <H1>
                <Translation {...messages.TR_404_TITLE} />
            </H1>
            <P size="tiny">
                <Translation {...messages.TR_404_DESCRIPTION} />
            </P>
            <Img src={resolveStaticPath('images/suite/404.svg')} />
            <Link href={getRoute('suite-index')}>
                <Button>
                    <Translation {...messages.TR_404_GO_TO_DASHBOARD} />
                </Button>
            </Link>
        </Wrapper>
    );
};
