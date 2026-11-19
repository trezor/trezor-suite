import { memo } from 'react';

import { gotoThunk } from '@suite/router';
import {
    selectAccountAssetTableState,
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

import { useSelector } from '#src/hooks/suite';
import { AssetTableRowView } from '#src/views/home/HomeAssetsTable/AssetTableRowView';

type AccountAssetRowProps = {
    accountKey: AccountKey;
    assetKey: WalletAssetKey;
};

/** A Home asset row with what one account holds of the asset. */
export const AccountAssetRow = memo(function AccountAssetRow({
    accountKey,
    assetKey,
}: AccountAssetRowProps) {
    const { dispatch } = useServices(injectDispatch);
    const networkSymbol = useSelector(state =>
        selectWalletAssetNetworkSymbol(selectAccountAssetTableState(state, accountKey), assetKey),
    );
    const contractAddress = useSelector(state =>
        selectWalletAssetContractAddress(selectAccountAssetTableState(state, accountKey), assetKey),
    );
    const tokenSymbol = useSelector(state =>
        selectWalletAssetTokenSymbol(selectAccountAssetTableState(state, accountKey), assetKey),
    );
    const tokenDecimals = useSelector(state =>
        selectWalletAssetTokenDecimals(selectAccountAssetTableState(state, accountKey), assetKey),
    );
    const amount = useSelector(state =>
        selectWalletAssetAmount(selectAccountAssetTableState(state, accountKey), assetKey),
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
