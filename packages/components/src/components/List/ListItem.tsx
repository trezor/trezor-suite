import styled from 'styled-components';

import { SpacingValues } from '@trezor/theme';

import { FlexAlignItems } from '../Flex/Flex';
import { useList, BulletVerticalAlignment } from './List';

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
    position: relative;
`;

const ContentWrapper = styled.div`
    flex: 1;
`;

export type ListItemProps = {
    children: React.ReactNode;
    bulletComponent?: React.ReactNode;
};

export const ListItem = ({ bulletComponent, children }: ListItemProps) => {
    const { bulletGap, bulletAlignment, bulletComponent: listBulletComponent } = useList();

    return (
        <Item $gap={bulletGap} $bulletAlignment={bulletAlignment}>
            <BulletWrapper>{bulletComponent ?? listBulletComponent}</BulletWrapper>
            <ContentWrapper>{children}</ContentWrapper>
        </Item>
    );
};
