import { useEffect, ComponentType } from 'react';
import { withSelectedAccountLoaded } from 'src/components/wallet';
import type { AppState, ExtendedMessageDescriptor } from 'src/types/suite';
import { useDispatch } from 'src/hooks/suite';
import { loadInvityData } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common';

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
    WrappedComponent: ComponentType<WithCoinmarketProps>,
    options: WithCoinmarketSavingsLoadedOptions,
) => {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const Component = withSelectedAccountLoaded(({ selectedAccount }) => {
        const dispatch = useDispatch();

        useEffect(() => {
            dispatch(loadInvityData());
        }, [dispatch]);

        return (
            <CoinmarketLayout selectedAccount={selectedAccount}>
                <WrappedComponent selectedAccount={selectedAccount} />
            </CoinmarketLayout>
        );
    }, options);
    Component.displayName = `withCoinmarket(${displayName})`;

    return Component;
};
