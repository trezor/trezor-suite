import React from 'react';
import styled from 'styled-components';

import { Link, Button, P, H2 } from '@trezor/components';

const Wrapper = styled.div`
    padding: 24px 0px;
`;

const ChooseBrowserWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Browser = styled.div`
    margin: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const BrowserNotSupported = () => (
    <Wrapper>
        <H2>Your browser is not supported</H2>
        <P>Please choose one of the supported browsers</P>
        <ChooseBrowserWrapper>
            <Browser>
                <P size="small">Google Chrome</P>
                <Link href="https://www.google.com/chrome/">
                    <Button>Get Chrome</Button>
                </Link>
            </Browser>
            <Browser>
                <P size="small">Mozzila Firefox</P>
                <Link href="https://www.mozilla.org/en-US/firefox/new/">
                    <Button>Get Firefox</Button>
                </Link>
            </Browser>
        </ChooseBrowserWrapper>
    </Wrapper>
);

export default BrowserNotSupported;
