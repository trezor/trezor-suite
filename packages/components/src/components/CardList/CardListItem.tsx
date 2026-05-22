import type { Padding } from '../../utils/frameProps';
import { Row } from '../Flex/Flex';
import { GhostContainer, type GhostContainerProps } from '../GhostContainer/GhostContainer';

export const cardListItemPaddingTypes = ['normal', 'medium', 'small'] as const;
export type CardListItemPaddingType = (typeof cardListItemPaddingTypes)[number];

const paddingMap: Record<CardListItemPaddingType, Padding> = {
    normal: { vertical: 16, horizontal: 20 },
    medium: { vertical: 12, horizontal: 20 },
    small: { vertical: 8, horizontal: 12 },
};

export type CardListItemProps = Omit<GhostContainerProps, 'borderRadius' | 'padding'> & {
    paddingType?: CardListItemPaddingType;
};

export const CardListItem = ({
    children,
    paddingType = 'normal',
    onClick,
    ...rest
}: CardListItemProps) => (
    <GhostContainer
        as="div"
        borderRadius={0}
        padding={paddingMap[paddingType]}
        backgroundColorOnInteraction={onClick ? 'elementFillElevatedHovered' : undefined}
        onClick={onClick}
        isDisabled={!onClick}
        {...rest}
    >
        <Row justifyContent="space-between" gap={12} overflow="hidden">
            {children}
        </Row>
    </GhostContainer>
);
