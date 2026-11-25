import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';

import { AssetTableRowView } from '#src/components/wallet/assets/AssetTableRowView';
import { useOpenAsset } from '#src/components/wallet/assets/useOpenAsset';
import { useSelector } from '#src/hooks/suite/useSelector';

type HomeAssetRowContainerProps = {
    assetKey: WalletAssetKey;
    hasBorderTop?: boolean;
    assetNameTestId?: string;
};

export const HomeAssetRowContainer = ({
    assetKey,
    hasBorderTop,
    assetNameTestId,
}: HomeAssetRowContainerProps) => {
    const openAsset = useOpenAsset({ from: 'home-asset-table' });
    const networkSymbol = useSelector(state => selectWalletAssetNetworkSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const tokenSymbol = useSelector(state => selectWalletAssetTokenSymbol(state, assetKey));
    const tokenDecimals = useSelector(state => selectWalletAssetTokenDecimals(state, assetKey));
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey));

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
            onOpen={() => openAsset({ networkSymbol, contractAddress })}
            hasBorderTop={hasBorderTop}
            assetNameTestId={assetNameTestId}
            data-testid={`@dashboard/home-asset-item/${networkSymbol}/${contractAddress ?? 'coin'}`}
        />
    );
};
