import React from 'react';
import { withCoinmarketSavingsLoaded, WithCoinmarketLoadedProps } from '@wallet-components';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import { Button } from '@trezor/components';
import styled from 'styled-components';

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

const CoinmarketSavingsSignIn = ({ selectedAccount }: WithCoinmarketLoadedProps) => {
    const { navigateToSavingsLogin, navigateToSavingsRegistration } = useCoinmarketNavigation(
        selectedAccount.account,
    );
    // TODO: translations
    // TODO: some graphics - icon/picture?
    return (
        <Wrapper>
            <Header>Start investing periodically</Header>
            <Description>
                Amet minim mollit non deserunt ullamco est sit aliqua dolor do.
            </Description>
            <StyledButtons>
                <Button variant="primary" onClick={() => navigateToSavingsRegistration()}>
                    Create an Invity account
                </Button>
                <Button variant="secondary" onClick={() => navigateToSavingsLogin()}>
                    Log in
                </Button>
            </StyledButtons>
        </Wrapper>
    );
};

export default withCoinmarketSavingsLoaded(CoinmarketSavingsSignIn, {
    checkInvityAuthenticationImmediately: false,
});
