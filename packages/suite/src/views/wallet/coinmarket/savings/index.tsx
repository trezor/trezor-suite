import React from 'react';
import {
    CoinmarketLayout,
    withSelectedAccountLoaded,
    WithSelectedAccountLoadedProps,
} from '@wallet-components';
// TODO: do not forget...
// import UnsupportedCountry from './unsupported-country';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import styled from 'styled-components';
import { Button } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-flow: column;
`;

const Header = styled.p`
    display: flex;
    font-size: 20px;
    justify-content: center;
`;

const Description = styled.p`
    display: flex;
    justify-content: center;
    margin-bottom: 34px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledButtons = styled.div`
    display: flex;
    flex-flow: row;
    justify-content: space-evenly;
`;

const CoinmarketSavingsLoaded = ({ selectedAccount }: WithSelectedAccountLoadedProps) => {
    const { navigateToInvityLogin, navigateToInvityRegistration } = useInvityNavigation(
        selectedAccount.account,
    );

    // TODO: translations
    return (
        <CoinmarketLayout>
            <Wrapper>
                <Header>Start investing periodically</Header>
                <Description>
                    Amet minim mollit non deserunt ullamco est sit aliqua dolor do.
                </Description>
                <StyledButtons>
                    <Button variant="primary" onClick={() => navigateToInvityRegistration()}>
                        Create an Invity account
                    </Button>
                    <Button variant="secondary" onClick={() => navigateToInvityLogin()}>
                        Log in
                    </Button>
                </StyledButtons>
            </Wrapper>
        </CoinmarketLayout>
    );
};
export default withSelectedAccountLoaded(CoinmarketSavingsLoaded, {
    title: 'TR_NAV_SAVINGS',
    redirectUnauthorizedUserToLogin: false,
});
