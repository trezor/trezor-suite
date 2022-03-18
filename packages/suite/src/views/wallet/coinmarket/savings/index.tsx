import React from 'react';
import { ReactSVG } from 'react-svg';
import { withCoinmarketSavingsLoaded, WithSelectedAccountLoadedProps } from '@wallet-components';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/build';
import { Translation } from '@suite-components/Translation';

const Wrapper = styled.div`
    display: flex;
    flex-flow: column;
    align-items: center;
`;

const Header = styled.p`
    display: flex;
    font-size: 20px;
    justify-content: center;
    margin-bottom: 7px;
    font-weight: 600;
`;

const Description = styled.p`
    display: flex;
    justify-content: center;
    margin-bottom: 34px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: 500;
`;

const StyledButtons = styled.div`
    display: flex;
    flex-flow: row;
    justify-content: space-evenly;
    button {
        margin: 0 10px;
    }
`;

const StyledGraphImage = styled.img`
    max-width: fit-content;
`;

const StyledInvityPlusBtcDirectSvg = styled(ReactSVG)`
    margin-bottom: 24px;
`;

const StyledRegisterButton = styled(Button)`
    padding: 9px 18px;
`;

const StyledLoginButton = styled(Button)`
    padding: 9px 38px;
`;

const CoinmarketSavingsLoaded = ({ selectedAccount }: WithSelectedAccountLoadedProps) => {
    const { navigateToInvityLogin, navigateToInvityRegistration } = useInvityNavigation(
        selectedAccount.account,
    );
    return (
        <Wrapper>
            <StyledGraphImage src={resolveStaticPath('images/suite/3d/graph.png')} alt="" />
            <StyledInvityPlusBtcDirectSvg
                src={resolveStaticPath('images/svg/invity-plus-btc-direct.svg')}
            />
            <Header>
                <Translation id="TR_SAVINGS_INTRODUCTION_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_INTRODUCTION_DESCRIPTION" />
            </Description>
            <StyledButtons>
                <StyledRegisterButton
                    variant="primary"
                    onClick={() => navigateToInvityRegistration()}
                >
                    <Translation id="TR_SAVINGS_INTRODUCTION_CREATE_ACCOUNT_BUTTON" />
                </StyledRegisterButton>
                <StyledLoginButton variant="secondary" onClick={() => navigateToInvityLogin()}>
                    <Translation id="TR_SAVINGS_INTRODUCTION_LOG_IN_BUTTON" />
                </StyledLoginButton>
            </StyledButtons>
        </Wrapper>
    );
};
export default withCoinmarketSavingsLoaded(CoinmarketSavingsLoaded, {
    title: 'TR_NAV_SAVINGS',
    redirectUnauthorizedUserToLogin: false,
});
