import React from 'react';
import styled, { css } from 'styled-components';
import Link from 'components/Link';
import P from 'components/Paragraph';
import { H2 } from 'components/Heading';

const Wrapper = styled.div``;

const ChooseBrowserWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const BrowserLogo = styled.div`
    margin-bottom: 10px;
    width: 43px;
    height: 43px;
    ${props => props.isChrome && css`
        background-image: url('../images/browser-chrome.png');
    `}
    ${props => props.isFirefox && css`
        background-image: url('../images/browser-firefox.png');
    `}
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
                <BrowserLogo isChrome />
                <P isSmaller>Google Chrome</P>
                <Link
                    text="Get Chrome"
                    href="https://www.google.com/chrome/"
                    target="_blank"
                    rel="noreferrer noopener"
                    isButton
                />
            </Browser>
            <Browser>
                <BrowserLogo isFirefox />
                <P isSmaller>Mozzila Firefox</P>
                <Link
                    text="Get Firefox"
                    href="https://www.mozilla.org/en-US/firefox/new/"
                    target="_blank"
                    rel="noreferrer noopener"
                    isButton
                />
            </Browser>
        </ChooseBrowserWrapper>
    </Wrapper>
);

export default BrowserNotSupported;
