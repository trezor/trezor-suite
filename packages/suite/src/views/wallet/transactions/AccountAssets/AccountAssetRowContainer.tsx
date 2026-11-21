import { memo } from 'react';

import { gotoThunk } from '@suite/router';
import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';
import { AssetTableRowView } from '#src/views/home/HomeAssetsTable/AssetTableRowView';

type AccountAssetRowContainerProps = {
    accountKey: AccountKey;
    assetKey: WalletAssetKey;
};

/** A Home asset row with what one account holds of the asset. */
export const AccountAssetRowContainer = memo(function AccountAssetRowContainer({
    accountKey,
    assetKey,
}: AccountAssetRowContainerProps) {
    const { dispatch } = useServices(injectDispatch);
    const networkSymbol = useSelector(state =>
        selectWalletAssetNetworkSymbol(state, assetKey, false, accountKey),
    );
    const contractAddress = useSelector(state =>
        selectWalletAssetContractAddress(state, assetKey, false, accountKey),
    );
    const tokenSymbol = useSelector(state =>
        selectWalletAssetTokenSymbol(state, assetKey, false, accountKey),
    );
    const tokenDecimals = useSelector(state =>
        selectWalletAssetTokenDecimals(state, assetKey, false, accountKey),
    );
    const amount = useSelector(state =>
        selectWalletAssetAmount(state, assetKey, false, accountKey),
    );

    if (networkSymbol === undefined) {
        return null;
    }

    return (
        <AssetTableRowView
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
            tokenSymbol={tokenSymbol}
            tokenDecimals={tokenDecimals}
            amount={amount}
            onOpen={() =>
                dispatch(
                    gotoThunk({
                        routeName: 'suite-asset',
                        params: { symbol: networkSymbol, contractAddress },
                    }),
                )
            }
            data-testid={`@wallet/account-asset/${networkSymbol}/${contractAddress ?? 'coin'}`}
        />
    );
});
