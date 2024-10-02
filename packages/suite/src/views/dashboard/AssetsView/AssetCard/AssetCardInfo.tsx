import { Network } from '@suite-common/wallet-config';
import React from 'react';
import { AssetFiatBalance } from '@suite-common/assets';
import { AssetCoinLogo, AssetCoinLogoSkeleton } from '../AssetCoinLogo';
import { AssetCoinName, AssetCoinNameSkeleton } from '../AssetCoinName';
import { Row } from '@trezor/components';

type AssetInfoProps = {
    network: Network;
    assetsFiatBalances?: AssetFiatBalance[];
    index?: number;
};

export const AssetCardInfo = ({ network, assetsFiatBalances, index }: AssetInfoProps) => (
    <Row>
        <AssetCoinLogo
            symbol={network.symbol}
            index={index}
            assetsFiatBalances={assetsFiatBalances}
        />
        <AssetCoinName network={network} />
    </Row>
);

type AssetInfoSkeletonProps = {
    animate?: boolean;
};

export const AssetCardInfoSkeleton = ({ animate }: AssetInfoSkeletonProps) => (
    <Row>
        <AssetCoinLogoSkeleton animate={animate} />
        <AssetCoinNameSkeleton animate={animate} />
    </Row>
);
