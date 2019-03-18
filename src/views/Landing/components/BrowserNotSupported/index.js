import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Button, P, H5, Link } from 'trezor-ui-components';

import ChromeImage from 'images/browser-chrome.png';
import FirefoxImage from 'images/browser-firefox.png';
import l10nMessages from './index.messages';

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
        <H5>
            <FormattedMessage {...l10nMessages.TR_YOUR_BROWSER_IS_NOT_SUPPORTED} />
        </H5>
        <P textAlign="center">
            <FormattedMessage {...l10nMessages.TR_PLEASE_CHOOSE_ONE_OF_THE_SUPPORTED} />
        </P>
        <ChooseBrowserWrapper>
            <Browser>
                <BrowserLogo src={ChromeImage} />
                <P size="small">Google Chrome</P>
                <Link href="https://www.google.com/chrome/">
                    <Button>
                        <FormattedMessage {...l10nMessages.TR_GET_CHROME} />
                    </Button>
                </Link>
            </Browser>
            <Browser>
                <BrowserLogo src={FirefoxImage} />
                <P size="small">Mozzila Firefox</P>
                <Link href="https://www.mozilla.org/en-US/firefox/new/">
                    <Button>
                        <FormattedMessage {...l10nMessages.TR_GET_FIREFOX} />
                    </Button>
                </Link>
            </Browser>
        </ChooseBrowserWrapper>
    </Wrapper>
);

export default BrowserNotSupported;
