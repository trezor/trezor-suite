import React from 'react';
import { WalletLayout } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import type { ExtendedMessageDescriptor } from '@suite-types';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';

export interface WithSelectedAccountLoadedProps {
    selectedAccount: SelectedAccountLoaded;
}

export interface WithSelectedAccountLoadedOptions {
    title: ExtendedMessageDescriptor['id'];
}

export const withSelectedAccountLoaded = (
    WrappedComponent: React.ComponentType<WithSelectedAccountLoadedProps>,
    options: WithSelectedAccountLoadedOptions,
) => {
    const { title } = options;
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Component = () => {
        const { selectedAccount } = useSelector(state => ({
            selectedAccount: state.wallet.selectedAccount,
        }));

        if (selectedAccount.status !== 'loaded') {
            return <WalletLayout title={title} account={selectedAccount} />;
        }
        return <WrappedComponent selectedAccount={selectedAccount} />;
    };
    Component.displayName = `withSelectedAccountLoaded(${displayName})`;
    return Component;
};
