import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetAmount,
    selectWalletAssetAvailableAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetStakingAmount,
    selectWalletAssetStakingRatio,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey, isSupportedStakingNetworkSymbol } from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useStakingRate } from '#src/hooks/earn/useStakingRate';
import { useSelector } from '#src/hooks/suite';

import { AssetDetailEarnCard } from './AssetDetailEarnCard';

type AssetDetailEarnProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailEarn = ({ assetKey }: AssetDetailEarnProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey));
    const availableAmount = useSelector(state => selectWalletAssetAvailableAmount(state, assetKey));
    const stakingAmount = useSelector(state => selectWalletAssetStakingAmount(state, assetKey));
    const stakingRatio = useSelector(state => selectWalletAssetStakingRatio(state, assetKey)) ?? 0;
    // The rate staking pays on the network, Tron's included, as the trade box and Earn show it.
    const { rate: apy } = useStakingRate({ symbol });

    if (
        symbol === undefined ||
        contractAddress !== undefined ||
        !isSupportedStakingNetworkSymbol(symbol) ||
        amount === undefined ||
        !isPositiveBalance(amount) ||
        availableAmount === undefined
    ) {
        return null;
    }

    return (
        <AssetDetailEarnCard
            symbol={symbol}
            availableAmount={availableAmount}
            stakingAmount={stakingAmount}
            stakingRatio={stakingRatio}
            apy={apy}
            onViewAll={() => {
                analytics.report({
                    type: events.navigateFlowEvent.name,
                    payload: {
                        action: 'navigate',
                        type: 'earn',
                        from: 'asset',
                        networkSymbol: symbol,
                    },
                });
                dispatch(gotoThunk({ routeName: 'suite-earn' }));
            }}
            data-testid="@asset-detail/earn"
        />
    );
};
