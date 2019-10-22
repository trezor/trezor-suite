import React from 'react';
import styled from 'styled-components';
import { H1, P, Link, Button } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/nextjs';

const Wrapper = styled.div`
    display: none;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: #fff;
    z-index: 99999;
    text-align: center;
    padding-top: 150px;
`;

const DownloadWrapper = styled.div``;

const UpdateWrapper = styled.div`
    display: none;
`;

const ContentWrapper = styled.div`
    width: 300px;
    margin: 15px auto;
`;

const Col = styled.div`
    float: left;
    width: 50%;
    text-align: center;
`;

const StyledButton = styled(Button)`
    display: inline;
    margin-top: 15px;
`;

const UnsupportedBrowser = () => (
    <Wrapper id="unsupported-browser">
        <DownloadWrapper id="download-browser">
            <H1>Your browser is not supported</H1>
            <P>Please choose one of the supported browsers</P>
            <ContentWrapper>
                <Col>
                    <img src={resolveStaticPath('images/browser-chrome.png')} alt="Chrome" />
                    <Link href="https://www.google.com/chrome/" target="_blank">
                        <StyledButton>Get Chrome</StyledButton>
                    </Link>
                </Col>
                <Col>
                    <img src={resolveStaticPath('images/browser-firefox.png')} alt="Firefox" />
                    <Link href="https://www.mozilla.org/firefox/" target="_blank">
                        <StyledButton>Get Firefox</StyledButton>
                    </Link>
                </Col>
            </ContentWrapper>
        </DownloadWrapper>
        <UpdateWrapper id="update-chrome">
            <H1>Your browser is outdated</H1>
            <P>Please update your browser to the latest version.</P>
            <Link
                href="https://support.google.com/chrome/answer/95414?co=GENIE.Platform%3DDesktop&hl=en"
                target="_blank"
            >
                <StyledButton>Update Chrome</StyledButton>
            </Link>
        </UpdateWrapper>
        <UpdateWrapper id="update-firefox">
            <H1>Your browser is outdated</H1>
            <P>Please update your browser to the latest version.</P>
            <Link
                href="https://support.mozilla.org/en-US/kb/update-firefox-latest-release"
                target="_blank"
            >
                <StyledButton>Update Firefox</StyledButton>
            </Link>
        </UpdateWrapper>
    </Wrapper>
);

export default UnsupportedBrowser;
