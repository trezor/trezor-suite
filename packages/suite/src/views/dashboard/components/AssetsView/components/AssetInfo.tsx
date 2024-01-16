import { Network } from '@suite-common/wallet-config';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { AssetShareIndicator, Icon, SkeletonCircle, SkeletonRectangle } from '@trezor/components';

import { spacingsPx, typography } from '@trezor/theme';
import { selectDeviceAccountsByNetworkSymbol } from '@suite-common/wallet-core';
import {
    AssetFiatBalance,
    AssetFiatBalanceWithPercentage,
    calculateAssetsPercentage,
} from '@suite-common/assets';

interface AssetInfoSkeletonProps {
    animate?: boolean;
}

export const ArrowIcon = styled(Icon)`
    transition: opacity 0.1s;
    margin-top: ${spacingsPx.xxs};
    margin-left: ${spacingsPx.xs};
`;
const Flex = styled.div`
    display: flex;
`;

const Container = styled.div`
    display: flex;
`;

const WalletContent = styled.div`
    flex: 1;
`;

const CoinName = styled.div`
    ${typography.body};
`;
const Wallets = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    margin-top: ${spacingsPx.xxs};
`;
const WalletNumber = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    font-variant-numeric: tabular-nums;
    ${typography.hint};
`;

const LogoWrapper = styled.div`
    padding-right: ${spacingsPx.sm};
    align-items: center;
`;

interface AssetInfoProps {
    network: Network;
    onClick?: () => void;
    assetsFiatBalances?: AssetFiatBalance[];
    index?: number;
}

export const AssetInfo = ({ network, onClick, assetsFiatBalances, index }: AssetInfoProps) => {
    const { symbol, name } = network;
    const selectedAccounts = useSelector((state: any) =>
        selectDeviceAccountsByNetworkSymbol(state, symbol),
    );

    const assetPercentage = assetsFiatBalances
        ? calculateAssetsPercentage(assetsFiatBalances).find(
              (asset: AssetFiatBalanceWithPercentage) => asset.symbol === symbol,
          )?.fiatPercentage
        : undefined;

    return (
        <Container onClick={onClick}>
            <LogoWrapper>
                <AssetShareIndicator
                    symbol={symbol}
                    size={24}
                    percentageShare={assetPercentage}
                    index={index}
                />
            </LogoWrapper>
            <WalletContent>
                <CoinName>{name}</CoinName>
                <Wallets>
                    <Icon icon="WALLET" size={16} />
                    <WalletNumber>{selectedAccounts.length}</WalletNumber>
                </Wallets>
            </WalletContent>
        </Container>
    );
};

export const AssetInfoSkeleton = ({ animate }: AssetInfoSkeletonProps) => (
    <Flex>
        <LogoWrapper>
            <SkeletonCircle size={44} />
        </LogoWrapper>
        <div>
            <CoinName>
                <SkeletonRectangle animate={animate} width={100} />
            </CoinName>
            <Wallets>
                <WalletNumber>
                    <SkeletonRectangle animate={animate} width={60} />
                </WalletNumber>
            </Wallets>
        </div>
    </Flex>
);
