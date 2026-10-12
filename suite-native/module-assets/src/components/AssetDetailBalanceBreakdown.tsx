import { useSelector } from 'react-redux';

import {
    type AssetsRootState,
    selectWalletAssetAmount,
    selectWalletAssetHasStaking,
    selectWalletAssetStakingAmount,
} from '@suite-common/assets';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { AssetDetailBalanceBreakdownRow } from './AssetDetailBalanceBreakdownRow';
import { useAssetDetailAsset } from '../hooks/useAssetDetailAsset';

export const AssetDetailBalanceBreakdown = () => {
    const { assetKey, tokenContract } = useAssetDetailAsset();
    const availableBalance = useSelector((state: AssetsRootState) =>
        selectWalletAssetAmount(state, assetKey),
    );
    const stakingBalance = useSelector((state: AssetsRootState) =>
        selectWalletAssetStakingAmount(state, assetKey),
    );
    const hasStakingBalance = useSelector((state: AssetsRootState) =>
        selectWalletAssetHasStaking(state, assetKey),
    );

    if (tokenContract !== undefined || availableBalance === undefined || !hasStakingBalance) {
        return null;
    }

    return (
        <VStack spacing="sp16">
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
