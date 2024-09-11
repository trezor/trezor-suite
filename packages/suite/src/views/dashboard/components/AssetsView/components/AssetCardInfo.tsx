import { Network } from '@suite-common/wallet-config';
import React from 'react';
import styled from 'styled-components';
import { AssetFiatBalance } from '@suite-common/assets';
import { AssetCoinLogo, AssetCoinLogoSkeleton } from './AssetCoinLogo';
import { AssetCoinName, AssetCoinNameSkeleton } from './AssetCoinName';

interface AssetInfoSkeletonProps {
    animate?: boolean;
}

const Flex = styled.div`
    display: flex;
`;

interface AssetInfoProps {
    network: Network;
    assetsFiatBalances?: AssetFiatBalance[];
    index?: number;
}

export const AssetCardInfo = ({ network, assetsFiatBalances, index }: AssetInfoProps) => (
    <Flex>
        <AssetCoinLogo
            symbol={network.symbol}
            index={index}
            assetsFiatBalances={assetsFiatBalances}
        />
        <AssetCoinName network={network} />
    </Flex>
);

export const AssetCardInfoSkeleton = ({ animate }: AssetInfoSkeletonProps) => (
    <Flex>
        <AssetCoinLogoSkeleton />
        <AssetCoinNameSkeleton animate={animate} />
    </Flex>
);
