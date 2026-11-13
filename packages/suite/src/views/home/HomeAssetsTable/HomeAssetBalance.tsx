import { memo } from 'react';

import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';

import { useSelector } from '#src/hooks/suite';

import { HomeAssetAmount } from './HomeAssetAmount';

type HomeAssetBalanceProps = {
    assetKey: WalletAssetKey;
    isHidden?: boolean;
};

export const HomeAssetBalance = memo(({ assetKey, isHidden }: HomeAssetBalanceProps) => {
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey, isHidden));
    const contractAddress = useSelector(state =>
        selectWalletAssetContractAddress(state, assetKey, isHidden),
    );
    const tokenSymbol = useSelector(state =>
        selectWalletAssetTokenSymbol(state, assetKey, isHidden),
    );
    const tokenDecimals = useSelector(state =>
        selectWalletAssetTokenDecimals(state, assetKey, isHidden),
    );
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey, isHidden));

    if (symbol === undefined || amount === undefined) {
        return null;
    }

    return (
        <HomeAssetAmount
            symbol={symbol}
            contractAddress={contractAddress}
            tokenSymbol={tokenSymbol}
            tokenDecimals={tokenDecimals}
            amount={amount}
        />
    );
});
