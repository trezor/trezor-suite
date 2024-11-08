import styled from 'styled-components';

import { spacings, spacingsPx } from '@trezor/theme';
import { AssetLogo, Badge, Column, Row, Text } from '@trezor/components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { getContractAddressForNetwork } from '@suite-common/wallet-utils';

import { CoinLogo } from '../CoinLogo/CoinLogo';
import { AssetOptionBaseProps } from './SelectAssetModal';

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
}

export const AssetItem = ({
    cryptoName,
    symbol,
    badge,
    networkSymbol,
    coingeckoId,
    shouldTryToFetch,
    contractAddress,
    handleClick,
}: AssetItemProps) => (
    <ClickableContainer
        onClick={() =>
            handleClick({
                symbol,
                contractAddress: contractAddress ?? null,
                networkSymbol,
                coingeckoId,
                cryptoName,
            })
        }
    >
        <Row gap={spacings.sm}>
            {coingeckoId ? (
                <AssetLogo
                    size={24}
                    coingeckoId={coingeckoId}
                    contractAddress={
                        networkSymbol && contractAddress
                            ? getContractAddressForNetwork(networkSymbol, contractAddress)
                            : undefined
                    }
                    placeholder={symbol.toUpperCase()}
                    shouldTryToFetch={shouldTryToFetch}
                />
            ) : (
                <CoinLogo size={24} symbol={networkSymbol as NetworkSymbol} />
            )}
            <Column flex="1" alignItems="stretch">
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
                    {symbol.toUpperCase()}
                </Text>
            </Column>
        </Row>
    </ClickableContainer>
);
