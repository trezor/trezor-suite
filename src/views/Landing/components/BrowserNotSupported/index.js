import React from 'react';
import styled from 'styled-components';
import Link from 'components/Link';
import Button from 'components/Button';
import P from 'components/Paragraph';
import { H2 } from 'components/Heading';

import ChromeImage from 'images/browser-chrome.png';
import FirefoxImage from 'images/browser-firefox.png';

const Wrapper = styled.div`
    padding: 24px 0px;
`;

const ChooseBrowserWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const BrowserLogo = styled.img`
    margin-bottom: 10px;
    width: 43px;
    height: 43px;
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
                <BrowserLogo src={ChromeImage} />
                <P isSmaller>Google Chrome</P>
                <Link href="https://www.google.com/chrome/">
                    <Button>Get Chrome</Button>
                </Link>
            </Browser>
            <Browser>
                <BrowserLogo src={FirefoxImage} />
                <P isSmaller>Mozzila Firefox</P>
                <Link href="https://www.mozilla.org/en-US/firefox/new/">
                    <Button>Get Firefox</Button>
                </Link>

            </Browser>
        </ChooseBrowserWrapper>
    </Wrapper>
);

export default BrowserNotSupported;
