import Head from 'next/head';
import styled from 'styled-components';

import { Button, H2, Paragraph } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { SUITE_MOBILE_APP_STORE, SUITE_MOBILE_PLAY_STORE } from '@trezor/urls';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: ${spacingsPx.xl};
    text-align: center;
    gap: ${spacingsPx.lg};
`;

const ButtonsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${spacingsPx.md};
`;

export const DeeplinkPage = () => (
    <>
        <Head>
            <title>Download Trezor Suite</title>
        </Head>
        <Wrapper>
            <H2>Get Trezor Suite</H2>
            <Paragraph>
                To use this link, you need the Trezor Suite mobile app. Download it for your device:
            </Paragraph>
            <ButtonsWrapper>
                <Button href={SUITE_MOBILE_PLAY_STORE} target="_blank">
                    Download on Google Play
                </Button>
                <Button href={SUITE_MOBILE_APP_STORE} target="_blank">
                    Download on App Store
                </Button>
            </ButtonsWrapper>
        </Wrapper>
    </>
);
