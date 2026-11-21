import {
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetUnstakedAccounts,
} from '@suite-common/assets';
import { selectStakeableStakingProductDescriptorBySymbol } from '@suite-common/earn-staking';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { isStakingBannerAccounts } from '#src/components/wallet/StakingBanner/useStakingBanner';
import { useSelector } from '#src/hooks/suite/useSelector';

import { AssetDetailAccountsStakingBanner } from './AssetDetailAccountsStakingBanner';

const NO_ACCOUNTS: readonly Account[] = [];

type AssetDetailStakingBannerProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailStakingBanner = ({ assetKey }: AssetDetailStakingBannerProps) => {
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));

    // The banner promotes a product the platform can stake into.
    const canStake = useSelector(
        state =>
            networkSymbol !== undefined &&
            contractAddress === undefined &&
            selectStakeableStakingProductDescriptorBySymbol(state, networkSymbol) !== null,
    );

    const accounts = useSelector(state =>
        canStake ? selectWalletAssetUnstakedAccounts(state, assetKey) : NO_ACCOUNTS,
    );

    if (!isStakingBannerAccounts(accounts)) {
        return null;
    }

    return <AssetDetailAccountsStakingBanner accounts={accounts} />;
};
