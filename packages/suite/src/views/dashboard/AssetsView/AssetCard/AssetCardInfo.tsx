import React from 'react';

import { Network } from '@suite-common/wallet-config';
import { AssetFiatBalance } from '@suite-common/assets';
import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AssetCoinLogo, AssetCoinLogoSkeleton } from '../AssetCoinLogo';
import { AssetCoinName, AssetCoinNameSkeleton } from '../AssetCoinName';

type AssetInfoProps = {
    network: Network;
    assetsFiatBalances?: AssetFiatBalance[];
    index?: number;
};

export const AssetCardInfo = ({ network, assetsFiatBalances, index }: AssetInfoProps) => (
    <Row gap={spacings.sm}>
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
