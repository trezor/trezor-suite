import { type ReactNode } from 'react';

import { type IconName } from '@suite-native/icons';

type TimelineDetailsCardDescriptionContainerProps = { children: ReactNode };

export type TimelineDetailsCardRenderItemIconParams = {
    item: TimelineDetailsCardItem;
    index: number;
};

export type TimelineDetailsCardItem = {
    id: string;
    title: ReactNode;
    description?: ReactNode;
    descriptionContainer?: (props: TimelineDetailsCardDescriptionContainerProps) => ReactNode;
    icon?: ReactNode;
};

export type TimelineDetailsCardProps = {
    headerTitle: ReactNode;
    headerIconName?: IconName;
    items: TimelineDetailsCardItem[];
    renderItemIcon?: (params: TimelineDetailsCardRenderItemIconParams) => ReactNode;
};
