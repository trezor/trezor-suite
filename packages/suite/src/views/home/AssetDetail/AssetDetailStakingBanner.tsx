import {
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetUnstakedAccounts,
} from '@suite-common/assets';
import { type WalletAssetKey, isSupportedStakingNetworkSymbol } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { isStakingBannerAccounts } from '#src/components/wallet/StakingBanner/useStakingBanner';
import { useSelector } from '#src/hooks/suite';

import { AssetDetailAccountsStakingBanner } from './AssetDetailAccountsStakingBanner';

const NO_ACCOUNTS: readonly Account[] = [];

type AssetDetailStakingBannerProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailStakingBanner = ({ assetKey }: AssetDetailStakingBannerProps) => {
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const canStake =
        networkSymbol !== undefined &&
        contractAddress === undefined &&
        isSupportedStakingNetworkSymbol(networkSymbol);
    const accounts = useSelector(state =>
        canStake ? selectWalletAssetUnstakedAccounts(state, assetKey) : NO_ACCOUNTS,
    );

    if (!isStakingBannerAccounts(accounts)) {
        return null;
    }

    return <AssetDetailAccountsStakingBanner accounts={accounts} />;
};
