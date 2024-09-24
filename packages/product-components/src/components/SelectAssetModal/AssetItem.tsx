import { spacings, spacingsPx } from '@trezor/theme';
import { AssetLogo, Badge, Column, Icon, Row, Text } from '@trezor/components';
import styled, { useTheme } from 'styled-components';

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

type AssetItemProps = {
    handleClick: (selectedAsset: string) => void;
    name: string;
    symbol: string;
    badge: string;
    isFavorite?: boolean;
    onFavoriteClick?: (isFavorite: boolean) => void;
};
export const AssetItem = ({
    handleClick,
    name,
    symbol,
    badge,
    isFavorite = false,
    onFavoriteClick,
}: AssetItemProps) => {
    const theme = useTheme();

    const handleFavoriteClick = () => onFavoriteClick?.(isFavorite);

    return (
        <ClickableContainer onClick={() => handleClick(symbol)}>
            <Row gap={spacings.sm} margin={{ right: spacings.md }}>
                <AssetLogo size={24} coingeckoId="bitcoin" placeholder="btc" />
                <Column flex="1" alignItems="stretch">
                    <Text typographyStyle="body">{name}</Text>
                    <Text typographyStyle="hint" variant="tertiary">
                        {symbol}
                    </Text>
                </Column>
                <div>
                    <Badge>{badge}</Badge>
                </div>
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
