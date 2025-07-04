import { ReactNode } from 'react';

import { useDynamicHeader } from './DynamicScreenHeaderContext';
import { ScreenHeader, ScreenSubHeaderProps } from '../ScreenHeader';

export type DynamicScreenHeaderProps = {
    content: ReactNode;
    subtitle?: ReactNode;
    isCompactOnly?: boolean;
} & ScreenSubHeaderProps;

export const DynamicScreenHeader = ({
    content,
    isCompactOnly = false,
    ...screenHeaderProps
}: DynamicScreenHeaderProps) => {
    const { isScrollableHeaderScrolled } = useDynamicHeader();

    const shouldRenderScreenHeaderContent = isScrollableHeaderScrolled || isCompactOnly;

    return (
        <ScreenHeader content={shouldRenderScreenHeaderContent && content} {...screenHeaderProps} />
    );
};
