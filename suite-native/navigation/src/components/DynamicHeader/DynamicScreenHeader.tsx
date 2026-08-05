import { type ReactNode } from 'react';

import { type NativeSpacing } from '@trezor/theme';

import { useDynamicHeader } from './DynamicScreenHeaderContext';
import { ScreenHeader, type ScreenHeaderProps } from '../ScreenHeader';

export type DynamicScreenHeaderProps = {
    subtitle?: ReactNode;
    isCompactOnly?: boolean;
    marginBottom?: NativeSpacing;
} & ScreenHeaderProps;

export const DynamicScreenHeader = ({
    title,
    isCompactOnly = false,
    ...screenHeaderProps
}: DynamicScreenHeaderProps) => {
    const { isScrollableHeaderScrolled } = useDynamicHeader();

    const shouldRenderScreenHeaderContent = isScrollableHeaderScrolled || isCompactOnly;

    return (
        <ScreenHeader
            {...screenHeaderProps}
            title={shouldRenderScreenHeaderContent ? title : undefined}
        />
    );
};
