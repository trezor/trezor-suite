import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetAmount,
    selectWalletAssetAvailableAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetStakingAmount,
    selectWalletAssetStakingRatio,
} from '@suite-common/assets';
import { selectIsStakingSupportedSymbol, useNetworkStakingRate } from '@suite-common/earn-staking';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { StakingSplitCard } from '#src/components/wallet/assets/StakingSplitCard';
import { useSelector } from '#src/hooks/suite/useSelector';

type AssetDetailEarnProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailEarn = ({ assetKey }: AssetDetailEarnProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey));
    const availableAmount = useSelector(state => selectWalletAssetAvailableAmount(state, assetKey));
    const stakingAmount = useSelector(state => selectWalletAssetStakingAmount(state, assetKey));
    const stakingRatio = useSelector(state => selectWalletAssetStakingRatio(state, assetKey)) ?? 0;

    const isStakingSupported = useSelector(
        state =>
            networkSymbol !== undefined && selectIsStakingSupportedSymbol(state, networkSymbol),
    );

    // The rate staking pays on the network, Tron's included, as the trade box and Earn show it.
    const stakingRate = useNetworkStakingRate({ networkSymbol: networkSymbol ?? null });

    if (
        networkSymbol === undefined ||
        contractAddress !== undefined ||
        !isStakingSupported ||
        amount === undefined ||
        !isPositiveBalance(amount) ||
        availableAmount === undefined
    ) {
        return null;
    }

    return (
        <StakingSplitCard
            networkSymbol={networkSymbol}
            availableAmount={availableAmount}
            stakingAmount={stakingAmount}
            stakingRatio={stakingRatio}
            stakingRate={stakingRate}
            showAllocation={isPositiveBalance(availableAmount) || isPositiveBalance(stakingAmount)}
            onViewAll={() => {
                analytics.report({
                    type: events.navigateFlowEvent.name,
                    payload: {
                        action: 'navigate',
                        type: 'earn',
                        from: 'asset',
                        networkSymbol,
                    },
                });
                dispatch(gotoThunk({ routeName: 'suite-earn' }));
            }}
            data-testid="@asset-detail/earn"
        />
    );
};
