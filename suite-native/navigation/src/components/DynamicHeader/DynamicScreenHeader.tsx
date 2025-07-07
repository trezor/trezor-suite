import { ReactNode } from 'react';

import { useDynamicHeader } from './DynamicScreenHeaderContext';
import { ScreenHeader, ScreenSubHeaderProps } from '../ScreenHeader';

export type DynamicScreenHeaderProps = {
    subtitle?: ReactNode;
    isCompactOnly?: boolean;
} & ScreenSubHeaderProps;

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
