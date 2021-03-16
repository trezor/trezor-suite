import React from 'react';

import { TrezorLogo, Button } from '@trezor/components';
import { TrezorLink, Translation } from '@suite-components';
import { ProgressBar } from '@onboarding-components/ProgressBar';
import styled from 'styled-components';
import { SUPPORT_URL } from '@suite-constants/urls';
import { MAX_WIDTH } from '@suite-constants/layout';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    background: ${props => props.theme.BG_LIGHT_GREY};
`;

const MaxWidth = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 1920px;
    flex: 1;
    padding: 20px;
    align-items: center;
`;

const Header = styled.div`
    display: flex;
    width: 100%;
    padding: 26px 40px;
    justify-content: space-between;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    color: ${props => props.theme.TYPE_DARK_GREY};
    justify-content: center;
    align-items: center;
    max-width: ${MAX_WIDTH};
    width: 100%;
`;

interface Props {
    children: React.ReactNode;
}

const OnboardingLayout = ({ children }: Props) => {
    return (
        <Wrapper>
            <MaxWidth>
                <Header>
                    <TrezorLogo type="suite" width="128px" />
                    <TrezorLink size="small" variant="nostyle" href={SUPPORT_URL}>
                        <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                            <Translation id="TR_HELP" />
                        </Button>
                    </TrezorLink>
                </Header>

                <Content>
                    <ProgressBar
                        steps={[
                            {
                                key: 'fw',
                                label: <Translation id="TR_ONBOARDING_STEP_FIRMWARE" />,
                            },
                            {
                                key: 'wallet',
                                label: <Translation id="TR_ONBOARDING_STEP_WALLET" />,
                            },
                            {
                                key: 'pin',
                                label: <Translation id="TR_ONBOARDING_STEP_PIN" />,
                            },
                            {
                                key: 'coins',
                                label: <Translation id="TR_ONBOARDING_STEP_COINS" />,
                            },
                            {
                                key: 'final',
                            },
                        ]}
                        // TODO
                        activeStep={0}
                    />
                    {children}
                </Content>
            </MaxWidth>
        </Wrapper>
    );
};

export default OnboardingLayout;
