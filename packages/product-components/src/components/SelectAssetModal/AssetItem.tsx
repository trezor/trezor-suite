import { spacings, spacingsPx } from '@trezor/theme';
import { Badge, Column, Icon, Row, Text } from '@trezor/components';
import styled, { useTheme } from 'styled-components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { SelectAssetOptionCurrencyProps } from './SelectAssetModal';

const ClickableContainer = styled.div`
    cursor: pointer;
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    border-radius: 4px;

    &:hover {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
    }
`;

const IconWrapper = styled.div`
    cursor: pointer;
`;

const TextWrapper = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const BadgeWrapper = styled.div`
    flex: none;
`;

type AssetItemProps = {
    name?: string;
    symbol: NetworkSymbol;
    badge: string | undefined;
    networkSymbol: NetworkSymbol;
    coingeckoId: string;
    logo: JSX.Element;
    isFavorite?: boolean;
    contractAddress: string | null;
    handleClick: (selectedAsset: SelectAssetOptionCurrencyProps) => void;
    onFavoriteClick?: (isFavorite: boolean) => void;
};

export const AssetItem = ({
    name,
    symbol,
    badge,
    networkSymbol,
    coingeckoId,
    logo,
    isFavorite = false,
    contractAddress,
    handleClick,
    onFavoriteClick,
}: AssetItemProps) => {
    const theme = useTheme();

    const handleFavoriteClick = onFavoriteClick ? () => onFavoriteClick(isFavorite) : undefined;

    return (
        <ClickableContainer
            onClick={() =>
                handleClick({
                    symbol,
                    contractAddress: contractAddress ?? null,
                    type: 'currency',
                    networkSymbol,
                    coingeckoId,
                })
            }
        >
            <Row gap={spacings.sm}>
                {logo}
                <Column flex="1" alignItems="stretch">
                    <Row gap={spacings.xs} alignItems="center">
                        <TextWrapper>
                            <Text typographyStyle="body" textWrap="nowrap">
                                {name}
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

                {handleFavoriteClick && (
                    <IconWrapper>
                        {isFavorite ? (
                            <Icon
                                name="starFilled"
                                color={theme.backgroundAlertYellowBoldAlt}
                                onClick={handleFavoriteClick}
                            />
                        ) : (
                            <Icon name="star" onClick={handleFavoriteClick} />
                        )}
                    </IconWrapper>
                )}
            </Row>
        </ClickableContainer>
    );
};
