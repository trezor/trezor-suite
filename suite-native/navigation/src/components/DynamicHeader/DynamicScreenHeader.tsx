import { ReactNode } from 'react';

import { useDynamicHeader } from './DynamicScreenHeaderContext';
import { ScreenHeader, ScreenSubHeaderProps } from '../ScreenHeader';

// TODO needs to accept prop `isCompactOnly` to override behavior. This is needed for empty states etc.
// If that prop is sent, we will only display the header at the top of the file.
export type DynamicScreenHeaderProps = {
    content: ReactNode;
    subtitle?: ReactNode;
} & ScreenSubHeaderProps;

export const DynamicScreenHeader = ({
    content,
    ...screenHeaderProps
}: DynamicScreenHeaderProps) => {
    const { isScrollableHeaderScrolled } = useDynamicHeader();

    return <ScreenHeader content={isScrollableHeaderScrolled && content} {...screenHeaderProps} />;
};
