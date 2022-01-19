import React from 'react';
import {
    InvityLayout,
    withSelectedAccountLoaded,
    WithSelectedAccountLoadedProps,
} from '@wallet-components';
import type { AppState } from '@suite-types';

export interface WithInvityLayoutProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

interface WithInvityLayoutOptions {
    redirectUnauthorizedUserToLogin?: boolean;
}

export const withInvityLayout = (
    WrappedComponent: React.ComponentType<WithInvityLayoutProps>,
    options: WithInvityLayoutOptions = { redirectUnauthorizedUserToLogin: true },
) => {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Component = withSelectedAccountLoaded(
        ({ selectedAccount }: WithSelectedAccountLoadedProps) => (
            <InvityLayout selectedAccount={selectedAccount}>
                <WrappedComponent selectedAccount={selectedAccount} />
            </InvityLayout>
        ),
        {
            title: 'TR_NAV_INVITY',
            redirectUnauthorizedUserToLogin: options.redirectUnauthorizedUserToLogin,
        },
    );
    Component.displayName = `withInvityLayout(${displayName})`;
    return Component;
};
