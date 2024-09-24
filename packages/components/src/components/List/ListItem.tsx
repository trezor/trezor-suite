import { SpacingValues, spacingsPx, Elevation, mapElevationToBorder } from '@trezor/theme';
import styled from 'styled-components';
import { FlexAlignItems } from '../Flex/Flex';
import { useList, BulletVerticalAlignment } from './List';
import { useElevation } from '../ElevationContext/ElevationContext';

type MapArgs = {
    $bulletAlignment: BulletVerticalAlignment;
};

const mapAlignmentToAlignItems = ({ $bulletAlignment }: MapArgs): FlexAlignItems => {
    const alignItemsMap: Record<BulletVerticalAlignment, FlexAlignItems> = {
        top: 'flex-start',
        center: 'center',
        bottom: 'flex-end',
    };

    return alignItemsMap[$bulletAlignment];
};

type ItemProps = {
    $gap: SpacingValues;
    $bulletAlignment: BulletVerticalAlignment;
};

const Item = styled.li<ItemProps>`
    display: flex;
    align-items: ${({ $bulletAlignment }) => mapAlignmentToAlignItems({ $bulletAlignment })};
    gap: ${({ $gap }) => $gap}px;
`;

const BulletWrapper = styled.div`
    flex: 0;
`;

const ContentWrapper = styled.div`
    flex: 1;
`;

const Circle = styled.div<{ $elevation: Elevation }>`
    width: ${spacingsPx.md};
    height: ${spacingsPx.md};
    border-radius: 50%;
    border: ${spacingsPx.xxs} solid ${mapElevationToBorder};
`;

export type ListItemProps = {
    children: React.ReactNode;
    bulletComponent?: React.ReactNode;
};

export const ListItem = ({ bulletComponent, children }: ListItemProps) => {
    const { bulletAlignment, bulletGap, bulletComponent: listBulletComponent } = useList();
    const { elevation } = useElevation();

    return (
        <Item $gap={bulletGap} $bulletAlignment={bulletAlignment}>
            <BulletWrapper>
                {bulletComponent ?? listBulletComponent ?? <Circle $elevation={elevation} />}
            </BulletWrapper>
            <ContentWrapper>{children}</ContentWrapper>
        </Item>
    );
};
