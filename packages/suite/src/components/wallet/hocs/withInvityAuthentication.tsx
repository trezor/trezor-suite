import React from 'react';
import {
    InvityAuthentication,
    WithInvityLayoutProps,
    withSelectedAccountLoaded,
} from '@wallet-components';

export interface WithInvityAuthenticationOptions {
    // TODO: Do we really need this?
    checkInvityAuthenticationImmediately?: boolean;
    navigate?: () => void;
    redirectUnauthorizedUserToLogin: boolean;
}

export type WithInvityAuthenticationProps = WithInvityLayoutProps;

export const withInvityAuthentication = (
    WrappedComponent: React.ComponentType<WithInvityAuthenticationProps>,
    options: WithInvityAuthenticationOptions = {
        checkInvityAuthenticationImmediately: true,
        redirectUnauthorizedUserToLogin: true,
    },
) => {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Component = withSelectedAccountLoaded(
        ({ selectedAccount }: WithInvityLayoutProps) => (
            <InvityAuthentication
                {...options}
                selectedAccount={selectedAccount}
                redirectUnauthorizedUserToLogin
            >
                <WrappedComponent selectedAccount={selectedAccount} />
            </InvityAuthentication>
        ),
        { title: 'TR_NAV_INVITY' },
    );
    Component.displayName = `withInvityAuthentication(${displayName})`;
    return Component;
};
