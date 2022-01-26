import React from 'react';
import { CoinmarketLayout, withSelectedAccountLoaded } from '@wallet-components';
import type { AppState, ExtendedMessageDescriptor } from '@suite-types';
import { useSelector } from '@suite-hooks';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';

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

interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
}

export interface WithCoinmarketSavingsLoadedProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
}

interface WithCoinmarketSavingsLoadedOptions {
    title: ExtendedMessageDescriptor['id'];
    redirectUnauthorizedUserToLogin: boolean;
    // TODO: Do we really need this?
    checkInvityAuthenticationImmediately?: boolean;
}

// TODO: translations
export const withCoinmarketSavingsLoaded = (
    WrappedComponent: React.ComponentType<WithCoinmarketSavingsLoadedProps>,
    options: WithCoinmarketSavingsLoadedOptions,
) => {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Component = withSelectedAccountLoaded(({ selectedAccount }) => {
        const { invityAuthentication } = useSelector(state => ({
            invityAuthentication: state.wallet.coinmarket.invityAuthentication,
        }));
        const { navigateToInvityRegistration, navigateToInvityLogin } = useInvityNavigation(
            selectedAccount.account,
        );
        if (!invityAuthentication || invityAuthentication.error?.code === 401) {
            return (
                <CoinmarketLayout>
                    <Wrapper>
                        <Header>Start investing periodically</Header>
                        <Description>
                            Amet minim mollit non deserunt ullamco est sit aliqua dolor do.
                        </Description>
                        <StyledButtons>
                            <Button
                                variant="primary"
                                onClick={() => navigateToInvityRegistration()}
                            >
                                Create an Invity account
                            </Button>
                            <Button variant="secondary" onClick={() => navigateToInvityLogin()}>
                                Log in
                            </Button>
                        </StyledButtons>
                    </Wrapper>
                </CoinmarketLayout>
            );
        }

        return (
            <CoinmarketLayout>
                <WrappedComponent selectedAccount={selectedAccount} />
            </CoinmarketLayout>
        );
    }, options);
    Component.displayName = `withCoinmarketSavingsLoaded(${displayName})`;
    return Component;
};
