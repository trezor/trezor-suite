import { gotoThunk } from '@suite/router';
import {
    selectAccountCoinAssetKey,
    selectWalletAssetAmount,
    selectWalletAssetAvailableAmount,
    selectWalletAssetStakingAmount,
    selectWalletAssetStakingRatio,
} from '@suite-common/assets';
import { isSupportedStakingNetworkSymbol, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useStakingRate } from '#src/hooks/earn/useStakingRate';
import { useSelector } from '#src/hooks/suite';
import { AssetDetailEarnCard } from '#src/views/home/AssetDetail/AssetDetailEarnCard';

type AccountAssetEarnProps = {
    accountKey: AccountKey;
    accountKeys: readonly AccountKey[];
};

/** The account's coin split as the asset detail splits the wallet's; View all opens Staking. */
export const AccountAssetEarn = ({ accountKey, accountKeys }: AccountAssetEarnProps) => {
    const { dispatch } = useServices(injectDispatch);
    const networkSymbol = useSelector(state => selectAccountByKey(state, accountKey)?.symbol);
    const coinKey = useSelector(state => selectAccountCoinAssetKey(state, accountKey));
    const amount = useSelector(state =>
        selectWalletAssetAmount(state, coinKey, false, accountKeys),
    );
    const availableAmount = useSelector(state =>
        selectWalletAssetAvailableAmount(state, coinKey, false, accountKeys),
    );
    const stakingAmount = useSelector(state =>
        selectWalletAssetStakingAmount(state, coinKey, false, accountKeys),
    );
    const stakingRatio =
        useSelector(state => selectWalletAssetStakingRatio(state, coinKey, false, accountKeys)) ??
        0;
    const { rate: apy } = useStakingRate({ symbol: networkSymbol, accountKey });

    if (
        networkSymbol === undefined ||
        !isSupportedStakingNetworkSymbol(networkSymbol) ||
        amount === undefined ||
        !isPositiveBalance(amount) ||
        availableAmount === undefined
    ) {
        return null;
    }

    return (
        <AssetDetailEarnCard
            networkSymbol={networkSymbol}
            availableAmount={availableAmount}
            stakingAmount={stakingAmount}
            stakingRatio={stakingRatio}
            apy={apy}
            onViewAll={() =>
                dispatch(gotoThunk({ routeName: 'wallet-staking', preserveParams: true }))
            }
            data-testid="@wallet/account-assets/earn"
        />
    );
};
