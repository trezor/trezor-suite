import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectWalletAssetAvailableAmount,
    selectWalletAssetHasStaking,
    selectWalletAssetStakingAmount,
} from '@suite-common/assets';
import { isSupportedAdaStakingNetworkSymbol } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { AssetDetailBalanceBreakdownRow } from './AssetDetailBalanceBreakdownRow';
import { useAssetDetailAsset } from '../hooks/useAssetDetailAsset';

export const AssetDetailBalanceBreakdown = () => {
    const { assetKey, networkSymbol, tokenContract } = useAssetDetailAsset();
    const availableBalance = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAvailableAmount(state, assetKey),
    );
    const stakingBalance = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetStakingAmount(state, assetKey),
    );
    const hasStakingBalance = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetHasStaking(state, assetKey),
    );

    if (
        tokenContract !== undefined ||
        availableBalance === undefined ||
        !hasStakingBalance ||
        (networkSymbol !== undefined && isSupportedAdaStakingNetworkSymbol(networkSymbol))
    ) {
        return null;
    }

    return (
        <VStack paddingHorizontal="sp20" paddingVertical="sp24" spacing="sp16">
            <AssetDetailBalanceBreakdownRow
                balance={availableBalance}
                label={<Translation id="moduleAssets.assetDetailScreen.balanceSection.available" />}
            />
            <AssetDetailBalanceBreakdownRow
                balance={stakingBalance}
                label={<Translation id="moduleAssets.assetDetailScreen.balanceSection.staking" />}
            />
        </VStack>
    );
};
