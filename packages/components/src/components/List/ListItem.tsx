import styled from 'styled-components';

import { SpacingValues } from '@trezor/theme';

import { BulletVerticalAlignment, useList } from './List';
import { FlexAlignItems } from '../Flex/Flex';

type MapArgs = {
    $bulletAlignment: BulletVerticalAlignment;
};

const mapAlignmentToAlignItems = ({ $bulletAlignment }: MapArgs): FlexAlignItems => {
    const alignItemsMap: Record<BulletVerticalAlignment, FlexAlignItems> = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
    };

    return alignItemsMap[$bulletAlignment];
};

type ItemProps = {
    $gap: SpacingValues;
    $bulletAlignment: BulletVerticalAlignment;
    $hasListStyleType: boolean;
    $hasBulletComponent: boolean;
};

const Item = styled.li<ItemProps>`
    display: ${({ $hasListStyleType, $hasBulletComponent }) =>
        $hasListStyleType && !$hasBulletComponent ? 'list-items' : 'flex'};
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
    'data-testid'?: string;
};

export const ListItem = ({
    bulletComponent,
    'data-testid': dataTestId,
    children,
}: ListItemProps) => {
    const {
        bulletGap,
        bulletAlignment,
        bulletComponent: listBulletComponent,
        listStyleType,
    } = useList();

    return (
        <Item
            $gap={bulletGap}
            $bulletAlignment={bulletAlignment}
            $hasListStyleType={!!listStyleType}
            $hasBulletComponent={!!bulletComponent}
            data-testid={dataTestId}
        >
            <BulletWrapper>{bulletComponent ?? listBulletComponent}</BulletWrapper>
            <ContentWrapper>{children}</ContentWrapper>
        </Item>
    );
};
