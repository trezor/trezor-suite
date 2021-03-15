import React from 'react';

import { H1, TrezorLogo, Button, variables } from '@trezor/components';
import { TrezorLink, Translation } from '@suite-components';
import styled from 'styled-components';
import { TREZOR_URL } from '@suite-constants/urls';

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

    @media only screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
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
    flex-direction: column;
    flex: 3;
    padding: 20px;
    background: ${props => props.theme.BG_GREY};
    color: ${props => props.theme.TYPE_DARK_GREY};
    justify-content: center;
    align-items: center;
`;

interface Props {
    children: React.ReactNode;
}

const WelcomeLayout = ({ children }: Props) => {
    return (
        <Wrapper>
            <Welcome>
                <Expander>
                    <TrezorLogo type="suite" width="128px" />
                    <WelcomeTitle>Welcome!</WelcomeTitle>
                </Expander>
                <Bottom>
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
