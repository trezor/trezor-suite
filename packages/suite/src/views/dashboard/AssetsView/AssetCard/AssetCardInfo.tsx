import React from 'react';

import { type AssetFiatBalance } from '@suite-common/assets';
import { type Network } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';

import { AssetCoinLogo, AssetCoinLogoSkeleton } from '../AssetCoinLogo';
import { AssetCoinName, AssetCoinNameSkeleton } from '../AssetCoinName';

type AssetInfoProps = {
    network: Network;
    assetsFiatBalances?: AssetFiatBalance[];
    index?: number;
};

export const AssetCardInfo = ({ network, assetsFiatBalances, index }: AssetInfoProps) => (
    <Row gap={12}>
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
    <Row gap={12}>
        <AssetCoinLogoSkeleton animate={animate} />
        <AssetCoinNameSkeleton animate={animate} />
    </Row>
);
