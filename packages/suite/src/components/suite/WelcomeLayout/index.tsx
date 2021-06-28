import React from 'react';
import styled from 'styled-components';
import { H1, TrezorLogo, Button, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { useMessageSystem } from '@suite-hooks/useMessageSystem';
import MessageSystemBanner from '@suite-components/Banners/MessageSystemBanner';
import TrezorLink from '@suite-components/TrezorLink';
import { isWeb } from '@suite-utils/env';
import { TREZOR_URL, SUITE_URL } from '@suite-constants/urls';
import { resolveStaticPath } from '@suite-utils/nextjs';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
`;

const Expander = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
`;

const Welcome = styled.div`
    display: flex;
    flex-direction: column;
    flex: 2;
    min-width: 380px;
    max-width: 660px;
    justify-content: center;
    align-items: center;
    background: ${props => props.theme.BG_LIGHT_GREY};

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const WelcomeTitle = styled(H1)`
    font-size: 60px;
    font-weight: bold;
    margin-top: 32px;
`;

const Bottom = styled.div`
    display: flex;
    margin: 24px 0px;
`;

const Content = styled.div`
    display: flex;
    position: relative;
    flex-direction: column;
    flex: 3;
    padding: 20px;
    background-color: ${props => props.theme.BG_GREY};
    background-image: url(${resolveStaticPath('images/svg/onboarding-welcome-bg.svg')});
    background-repeat: no-repeat;
    background-position: center;
    background-attachment: local;
    background-size: 570px 570px;
    color: ${props => props.theme.TYPE_DARK_GREY};
    align-items: center;
    overflow-y: auto;
`;

const StyledTrezorLink = styled(TrezorLink)`
    margin-right: 14px;
`;

const BannerWrapper = styled.div`
    position: absolute;
    z-index: 1;
    width: 100%;
`;

interface Props {
    children: React.ReactNode;
}

// WelcomeLayout is a top-level wrapper similar to @suite-components/SuiteLayout
// used in Preloader and Onboarding
const WelcomeLayout = ({ children }: Props) => {
    const { banner } = useMessageSystem();
    return (
        <Wrapper>
            {banner && (
                <BannerWrapper>
                    <MessageSystemBanner message={banner} />
                </BannerWrapper>
            )}
            <Welcome>
                <Expander>
                    <TrezorLogo type="suite" width="128px" />
                    <WelcomeTitle>
                        <Translation id="TR_ONBOARDING_WELCOME_HEADING" />
                    </WelcomeTitle>
                </Expander>
                <Bottom>
                    {isWeb() && (
                        <StyledTrezorLink size="small" variant="nostyle" href={SUITE_URL}>
                            <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                                <Translation id="TR_ONBOARDING_DOWNLOAD_DESKTOP_APP" />
                            </Button>
                        </StyledTrezorLink>
                    )}
                    <TrezorLink size="small" variant="nostyle" href={TREZOR_URL}>
                        <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                            trezor.io
                        </Button>
                    </TrezorLink>
                </Bottom>
            </Welcome>

            <Content>{children}</Content>
        </Wrapper>
    );
};

export default WelcomeLayout;
