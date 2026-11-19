import { memo } from 'react';

import { type AssetTableSelectors, homeAssetTableSelectors } from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';

import { useSelector } from '#src/hooks/suite';

import { HomeAssetAmount } from './HomeAssetAmount';

type HomeAssetBalanceProps = {
    assetKey: WalletAssetKey;
    isHidden?: boolean;
    selectors?: AssetTableSelectors;
};

export const HomeAssetBalance = memo(
    ({ assetKey, isHidden, selectors = homeAssetTableSelectors }: HomeAssetBalanceProps) => {
        const {
            selectWalletAssetAmount,
            selectWalletAssetContractAddress,
            selectWalletAssetNetworkSymbol,
        } = selectors;
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
            <HomeAssetAmount
                symbol={networkSymbol}
                contractAddress={contractAddress}
                amount={amount}
            />
        );
    },
);
