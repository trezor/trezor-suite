import React from 'react';
import { CoinmarketLayout, WalletLayout } from '@wallet-components';
import type { AppState, ExtendedMessageDescriptor } from '@suite-types';
import { useSelector } from '@suite-hooks';

interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
}

export interface WithCoinmarketLoadedProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
}

export const withCoinmarketLoaded = (
    WrappedComponent: React.ComponentType<WithCoinmarketLoadedProps>,
    title: ExtendedMessageDescriptor['id'],
) => {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const ComponentCoinmarketWithLoaded = () => {
        const props = useSelector(state => ({
            selectedAccount: state.wallet.selectedAccount,
        }));

        const { selectedAccount } = props;
        if (selectedAccount.status !== 'loaded') {
            return <WalletLayout title={title} account={selectedAccount} />;
        }
        return (
            <CoinmarketLayout>
                <WrappedComponent {...props} selectedAccount={selectedAccount} />
            </CoinmarketLayout>
        );
    };
    ComponentCoinmarketWithLoaded.displayName = `withCoinmarketLoaded(${displayName})`;
    return ComponentCoinmarketWithLoaded;
};
