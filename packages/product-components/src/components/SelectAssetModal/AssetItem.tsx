import { type ReactNode } from 'react';

import styled from 'styled-components';

import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Badge, Column, Row, Text } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { type AssetOptionBaseProps } from './types';
import { isCoinSymbol } from '../../constants/coins';
import { AssetLogo } from '../AssetLogo/AssetLogo';
import { CoinLogo } from '../CoinLogo/CoinLogo';

const ClickableContainer = styled.div`
    cursor: pointer;
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    border-radius: 4px;

    &:hover {
        background: ${({ theme }) => theme.legacyBackgroundTertiaryPressedOnElevation0};
    }
`;

const TextWrapper = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const BadgeWrapper = styled.div`
    flex: none;
`;

type AssetItemProps = AssetOptionBaseProps & {
    handleClick: (selectedAsset: AssetOptionBaseProps) => void;
    'data-testid'?: string;
    balance?: ReactNode;
};

export const AssetItem = ({
    cryptoName,
    ticker,
    badge,
    symbol,
    coingeckoId,
    shouldTryToFetch,
    contractAddress,
    handleClick,
    balance,
    'data-testid': dataTestId,
}: AssetItemProps) => {
    const getCoinLogo = () =>
        isCoinSymbol(symbol) ? (
            <CoinLogo size={24} symbol={symbol} type="tokenWithNetwork" />
        ) : null;
    const displaySymbol = getDisplaySymbol(ticker, contractAddress);

    return (
        <ClickableContainer
            onClick={() =>
                handleClick({
                    ticker,
                    contractAddress: contractAddress ?? null,
                    symbol,
                    coingeckoId,
                    cryptoName,
                })
            }
        >
            <Row justifyContent="space-between" gap={spacings.sm}>
                <Row data-testid={dataTestId} gap={spacings.sm}>
                    {coingeckoId ? (
                        <AssetLogo
                            size={24}
                            symbol={symbol}
                            contractAddress={contractAddress}
                            placeholder={displaySymbol}
                            shouldTryToFetch={shouldTryToFetch}
                        />
                    ) : (
                        getCoinLogo()
                    )}

                    <Column flex="1">
                        <Row gap={spacings.xs} alignItems="center">
                            <TextWrapper>
                                <Text typographyStyle="body-md" textWrap="nowrap">
                                    {cryptoName}
                                </Text>
                            </TextWrapper>
                            {badge && (
                                <BadgeWrapper>
                                    <Badge>{badge}</Badge>
                                </BadgeWrapper>
                            )}
                        </Row>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {displaySymbol}
                        </Text>
                    </Column>
                </Row>

                {balance}
            </Row>
        </ClickableContainer>
    );
};
