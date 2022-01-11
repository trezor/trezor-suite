import React from 'react';
import { CoinmarketAuthentication } from '@wallet-components';

export interface WithCoinmarketAuthenticationOptions {
    // TODO: Do we really need this?
    checkInvityAuthenticationImmediately?: boolean;
}

export const withCoinmarketAuthentication = (
    WrappedComponent: React.ComponentType<Record<string, any>>,
    options: WithCoinmarketAuthenticationOptions = { checkInvityAuthenticationImmediately: true },
) => {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const ComponentCoinmarketWithAuthentication = () => (
        <CoinmarketAuthentication {...options}>
            <WrappedComponent />
        </CoinmarketAuthentication>
    );
    ComponentCoinmarketWithAuthentication.displayName = `withCoinmarketAuthentication(${displayName})`;
    return ComponentCoinmarketWithAuthentication;
};
