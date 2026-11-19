import { memo } from 'react';

import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';

import { useSelector } from '#src/hooks/suite/useSelector';

import { HomeAssetAmount } from './HomeAssetAmount';

type HomeAssetBalanceContainerProps = {
    assetKey: WalletAssetKey;
    isHidden?: boolean;
};

export const HomeAssetBalanceContainer = memo(function HomeAssetBalanceContainer({
    assetKey,
    isHidden,
}: HomeAssetBalanceContainerProps) {
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
        <HomeAssetAmount symbol={networkSymbol} contractAddress={contractAddress} amount={amount} />
    );
});
