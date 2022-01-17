import React from 'react';
import { CoinmarketAuthentication, WithCoinmarketLoadedProps } from '@wallet-components';

export interface WithCoinmarketAuthenticationOptions {
    // TODO: Do we really need this?
    checkInvityAuthenticationImmediately?: boolean;
}

export type WithCoinmarketAuthenticationProps = WithCoinmarketLoadedProps;

export const withCoinmarketAuthentication = <TProps extends WithCoinmarketAuthenticationProps>(
    WrappedComponent: React.ComponentType<TProps>,
    options: WithCoinmarketAuthenticationOptions = { checkInvityAuthenticationImmediately: true },
) => {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const ComponentCoinmarketWithAuthentication = (props: TProps) => (
        <CoinmarketAuthentication {...options} selectedAccount={props.selectedAccount}>
            <WrappedComponent {...props} />
        </CoinmarketAuthentication>
    );
    ComponentCoinmarketWithAuthentication.displayName = `withCoinmarketAuthentication(${displayName})`;
    return ComponentCoinmarketWithAuthentication;
};
