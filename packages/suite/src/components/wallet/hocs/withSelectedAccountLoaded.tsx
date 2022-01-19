import React from 'react';
import { InvityAuthentication, WalletLayout } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import type { AppState, ExtendedMessageDescriptor } from '@suite-types';

export interface WithSelectedAccountLoadedProps {
    selectedAccount: Extract<AppState['wallet']['selectedAccount'], { status: 'loaded' }>;
}

export interface WithSelectedAccountLoadedOptions {
    title: ExtendedMessageDescriptor['id'];
    redirectUnauthorizedUserToLogin?: boolean;
}

export const withSelectedAccountLoaded = (
    WrappedComponent: React.ComponentType<WithSelectedAccountLoadedProps>,
    options: WithSelectedAccountLoadedOptions,
) => {
    const { title, redirectUnauthorizedUserToLogin } = options;
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Component = () => {
        const { selectedAccount } = useSelector(state => ({
            selectedAccount: state.wallet.selectedAccount,
        }));

        if (selectedAccount.status !== 'loaded') {
            return <WalletLayout title={title} account={selectedAccount} />;
        }
        return (
            <InvityAuthentication
                selectedAccount={selectedAccount}
                redirectUnauthorizedUserToLogin={redirectUnauthorizedUserToLogin}
            >
                <WrappedComponent selectedAccount={selectedAccount} />
            </InvityAuthentication>
        );
    };
    Component.displayName = `withSelectedAccountLoaded(${displayName})`;
    return Component;
};
