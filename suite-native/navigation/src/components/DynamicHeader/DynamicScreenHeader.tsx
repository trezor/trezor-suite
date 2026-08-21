import { type ReactNode } from 'react';

import { type NativeSpacing } from '@trezor/theme';

import { useDynamicHeader } from './DynamicScreenHeaderContext';
import { ScreenHeader, type ScreenHeaderProps } from '../ScreenHeader';

export type DynamicScreenHeaderProps = {
    subtitle?: ReactNode;
    isCompactOnly?: boolean;
    marginBottom?: NativeSpacing;
    compactContent?: ReactNode;
    expandedContent?: ReactNode;
    scrollThreshold?: number;
} & ScreenHeaderProps;

export const DynamicScreenHeader = ({
    title,
    isCompactOnly = false,
    compactContent,
    ...screenHeaderProps
}: DynamicScreenHeaderProps) => {
    const { isScrollableHeaderScrolled } = useDynamicHeader();

    const shouldRenderScreenHeaderContent = isScrollableHeaderScrolled || isCompactOnly;

    return (
        <ScreenHeader
            {...screenHeaderProps}
            title={shouldRenderScreenHeaderContent && !compactContent ? title : undefined}
            customContent={shouldRenderScreenHeaderContent ? compactContent : undefined}
        />
    );
};
