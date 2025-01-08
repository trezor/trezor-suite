import styled from 'styled-components';

import { spacings, spacingsPx } from '@trezor/theme';
import { AssetLogo, Badge, Column, Row, Text } from '@trezor/components';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { getDisplaySymbol } from '@suite-common/wallet-config';

import { CoinLogo } from '../CoinLogo/CoinLogo';
import { AssetOptionBaseProps } from './SelectAssetModal';
import { isCoinSymbol } from '../CoinLogo/coins';

const ClickableContainer = styled.div`
    cursor: pointer;
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    border-radius: 4px;

    &:hover {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
    }
`;

const TextWrapper = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const BadgeWrapper = styled.div`
    flex: none;
`;

interface AssetItemProps extends AssetOptionBaseProps {
    handleClick: (selectedAsset: AssetOptionBaseProps) => void;
    'data-testid'?: string;
}

export const AssetItem = ({
    cryptoName,
    ticker,
    badge,
    symbol,
    coingeckoId,
    shouldTryToFetch,
    contractAddress,
    handleClick,
    'data-testid': dataTestId,
}: AssetItemProps) => {
    const getCoinLogo = () =>
        isCoinSymbol(symbol) ? <CoinLogo size={24} symbol={symbol} /> : null;
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
            <Row data-testid={dataTestId} gap={spacings.sm}>
                {coingeckoId ? (
                    <AssetLogo
                        size={24}
                        coingeckoId={coingeckoId}
                        contractAddress={
                            symbol && contractAddress
                                ? getContractAddressForNetworkSymbol(symbol, contractAddress)
                                : undefined
                        }
                        placeholder={displaySymbol}
                        shouldTryToFetch={shouldTryToFetch}
                    />
                ) : (
                    getCoinLogo()
                )}
                <Column flex="1">
                    <Row gap={spacings.xs} alignItems="center">
                        <TextWrapper>
                            <Text typographyStyle="body" textWrap="nowrap">
                                {cryptoName}
                            </Text>
                        </TextWrapper>
                        {badge && (
                            <BadgeWrapper>
                                <Badge>{badge}</Badge>
                            </BadgeWrapper>
                        )}
                    </Row>
                    <Text typographyStyle="hint" variant="tertiary">
                        {displaySymbol}
                    </Text>
                </Column>
            </Row>
        </ClickableContainer>
    );
};
