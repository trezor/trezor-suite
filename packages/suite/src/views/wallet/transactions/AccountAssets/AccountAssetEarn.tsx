import { gotoThunk } from '@suite/router';
import {
    getWalletAssetKey,
    isSupportedStakingNetworkSymbol,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useStakingRate } from '#src/hooks/earn/useStakingRate';
import { useSelector } from '#src/hooks/suite';
import { AssetDetailEarnCard } from '#src/views/home/AssetDetail/AssetDetailEarnCard';
import { useAssetTableSelectors } from '#src/views/home/HomeAssetsTable/assetTableSelectorsContext';

type AccountAssetEarnProps = {
    accountKey: AccountKey;
};

/** The account's coin split as the asset detail splits the wallet's; View all opens Staking. */
export const AccountAssetEarn = ({ accountKey }: AccountAssetEarnProps) => {
    const { dispatch } = useServices(injectDispatch);
    const {
        selectWalletAssetAmount,
        selectWalletAssetAvailableAmount,
        selectWalletAssetStakingAmount,
        selectWalletAssetStakingRatio,
    } = useAssetTableSelectors();
    const account = useSelector(state => selectAccountByKey(state, accountKey));
    const networkSymbol = account?.symbol;
    const coinKey =
        account === null
            ? undefined
            : getWalletAssetKey({
                  deviceState: account.deviceState,
                  networkSymbol: account.symbol,
                  contractAddress: undefined,
              });
    const amount = useSelector(state => selectWalletAssetAmount(state, coinKey));
    const availableAmount = useSelector(state => selectWalletAssetAvailableAmount(state, coinKey));
    const stakingAmount = useSelector(state => selectWalletAssetStakingAmount(state, coinKey));
    const stakingRatio = useSelector(state => selectWalletAssetStakingRatio(state, coinKey)) ?? 0;
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
