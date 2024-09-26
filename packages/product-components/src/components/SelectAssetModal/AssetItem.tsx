import { spacings, spacingsPx } from '@trezor/theme';
import { Badge, Column, Icon, Row, Text } from '@trezor/components';
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

const TextWrapper = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
`;

const BadgeWrapper = styled.div`
    flex: none;
`;

type AssetItemProps = {
    cryptoId: string;
    name: string;
    symbol: string;
    badge: string | undefined;
    logo: JSX.Element;
    isFavorite?: boolean;
    handleClick: (selectedAsset: string) => void;
    onFavoriteClick?: (isFavorite: boolean) => void;
};

export const AssetItem = ({
    cryptoId,
    name,
    symbol,
    badge,
    logo,
    isFavorite = false,
    handleClick,
    onFavoriteClick,
}: AssetItemProps) => {
    const theme = useTheme();

    const handleFavoriteClick = onFavoriteClick ? () => onFavoriteClick(isFavorite) : undefined;

    return (
        <ClickableContainer onClick={() => handleClick(cryptoId)}>
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
                        {symbol}
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
