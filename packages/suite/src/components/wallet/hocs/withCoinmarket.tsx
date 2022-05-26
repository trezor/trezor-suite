import React, { useEffect } from 'react';
import { CoinmarketLayout, withSelectedAccountLoaded } from '@wallet-components';
import type { AppState, ExtendedMessageDescriptor } from '@suite-types';
import { useActions } from '@suite-hooks';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';

interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
}

export interface WithCoinmarketProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
}

interface WithCoinmarketSavingsLoadedOptions {
    title: ExtendedMessageDescriptor['id'];
}

export const withCoinmarket = (
    WrappedComponent: React.ComponentType<WithCoinmarketProps>,
    options: WithCoinmarketSavingsLoadedOptions,
) => {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Component = withSelectedAccountLoaded(({ selectedAccount }) => {
        const { loadInvityData } = useActions({
            loadInvityData: coinmarketCommonActions.loadInvityData,
        });

        useEffect(() => {
            loadInvityData();
        }, [loadInvityData]);

        return (
            <CoinmarketLayout selectedAccount={selectedAccount}>
                <WrappedComponent selectedAccount={selectedAccount} />
            </CoinmarketLayout>
        );
    }, options);
    Component.displayName = `withCoinmarket(${displayName})`;
    return Component;
};
