import { useSelector } from 'react-redux';

import {
    type AssetsRootState,
    selectAssetAvailableCryptoBalance,
    selectAssetHasStakingBalance,
    selectAssetStakingCryptoBalance,
} from '@suite-common/assets';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { AssetDetailBalanceBreakdownRow } from './AssetDetailBalanceBreakdownRow';
import { useAssetDetailRouteParams } from '../hooks/useAssetDetailRouteParams';

export const AssetDetailBalanceBreakdown = () => {
    const { networkSymbol, tokenContract } = useAssetDetailRouteParams();
    const availableBalance = useSelector((state: AssetsRootState) =>
        selectAssetAvailableCryptoBalance(state, networkSymbol),
    );
    const stakingBalance = useSelector((state: AssetsRootState) =>
        selectAssetStakingCryptoBalance(state, networkSymbol),
    );
    const hasStakingBalance = useSelector((state: AssetsRootState) =>
        selectAssetHasStakingBalance(state, networkSymbol),
    );

    if (tokenContract || !hasStakingBalance) return null;

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
