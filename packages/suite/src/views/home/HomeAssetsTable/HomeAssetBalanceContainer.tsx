import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';

import { AssetTableAmount } from '#src/components/wallet/assets/AssetTableAmount';
import { useSelector } from '#src/hooks/suite/useSelector';

type HomeAssetBalanceContainerProps = {
    assetKey: WalletAssetKey;
    isHidden?: boolean;
};

export const HomeAssetBalanceContainer = ({
    assetKey,
    isHidden,
}: HomeAssetBalanceContainerProps) => {
    const networkSymbol = useSelector(state =>
        selectWalletAssetNetworkSymbol(state, assetKey, isHidden),
    );
    const contractAddress = useSelector(state =>
        selectWalletAssetContractAddress(state, assetKey, isHidden),
    );
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey, isHidden));

    if (networkSymbol === undefined || amount === undefined) {
        return null;
    }

    return (
        <AssetTableAmount
            symbol={networkSymbol}
            contractAddress={contractAddress}
            amount={amount}
        />
    );
};
