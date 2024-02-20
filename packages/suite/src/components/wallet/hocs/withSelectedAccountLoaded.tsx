import { ComponentType } from 'react';
import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import type { ExtendedMessageDescriptor } from 'src/types/suite';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';

export interface WithSelectedAccountLoadedProps {
    selectedAccount: SelectedAccountLoaded;
}

export interface WithSelectedAccountLoadedOptions {
    title: ExtendedMessageDescriptor['id'];
}

export const withSelectedAccountLoaded = (
    WrappedComponent: ComponentType<WithSelectedAccountLoadedProps>,
    options: WithSelectedAccountLoadedOptions,
) => {
    const { title } = options;
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Component = () => {
        const selectedAccount = useSelector(state => state.wallet.selectedAccount);

        if (selectedAccount.status !== 'loaded') {
            return <WalletLayout title={title} account={selectedAccount} />;
        }

        return <WrappedComponent selectedAccount={selectedAccount} />;
    };
    Component.displayName = `withSelectedAccountLoaded(${displayName})`;

    return Component;
};
