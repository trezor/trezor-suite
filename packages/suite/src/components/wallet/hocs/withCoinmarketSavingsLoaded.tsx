import React, { useEffect } from 'react';
import { CoinmarketLayout, withSelectedAccountLoaded } from '@wallet-components';
import type { AppState, ExtendedMessageDescriptor } from '@suite-types';
import { useActions, useSelector } from '@suite-hooks';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsAction from '@wallet-actions/coinmarketSavingsActions';

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

export const withCoinmarketSavingsLoaded = (
    WrappedComponent: React.ComponentType<WithCoinmarketSavingsLoadedProps>,
    options: WithCoinmarketSavingsLoadedOptions,
) => {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Component = withSelectedAccountLoaded(({ selectedAccount }) => {
        const { selectedProvider } = useSelector(state => ({
            selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
        }));
        const { loadSavingsTrade, loadInvityData } = useActions({
            loadSavingsTrade: coinmarketSavingsAction.loadSavingsTrade,
            loadInvityData: coinmarketCommonActions.loadInvityData,
        });

        useEffect(() => {
            loadInvityData();
        }, [loadInvityData]);

        useEffect(() => {
            if (selectedProvider) {
                loadSavingsTrade(selectedProvider.name);
            }
        }, [loadSavingsTrade, selectedProvider]);

        return (
            <CoinmarketLayout>
                <WrappedComponent selectedAccount={selectedAccount} />
            </CoinmarketLayout>
        );
    }, options);
    Component.displayName = `withCoinmarketSavingsLoaded(${displayName})`;
    return Component;
};
