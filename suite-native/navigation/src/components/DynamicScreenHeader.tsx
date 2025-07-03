import { ReactNode } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { Box, Text } from '@suite-native/atoms';

import { useHeader } from './DynamicScreenHeaderContext';
import { ScreenHeader, ScreenSubHeaderProps } from './ScreenHeader';

// TODO needs to accept prop `isCompactOnly` to override behavior. This is needed for empty states etc.
// If that prop is sent, we will only display the header at the top of the file.
export type DynamicScreenHeaderProps = {
    content: ReactNode;
    subtitle?: ReactNode;
} & ScreenSubHeaderProps;

type DynamicScrollableHeaderProps = {
    content?: ReactNode;
    subtitle?: ReactNode;
};

export const DynamicScrollableHeader = ({ content, subtitle }: DynamicScrollableHeaderProps) => {
    const { isHeaderVisible, setScrollableHeaderHeight } = useHeader();

    if (!isHeaderVisible) return null;

    const handleLayout = (e: LayoutChangeEvent) => {
        const { height } = e.nativeEvent.layout;
        setScrollableHeaderHeight(height);
    };

    return (
        <Box paddingHorizontal="sp16" marginTop="sp16" marginBottom="sp32">
            <Text variant="titleMedium" onLayout={handleLayout}>
                {content}
            </Text>
            {subtitle && <Text color="textSubdued">{subtitle}</Text>}
        </Box>
    );
};

export const DynamicScreenHeader = ({
    content,
    ...screenHeaderProps
}: DynamicScreenHeaderProps) => {
    const { isScrolled } = useHeader();

    return <ScreenHeader content={isScrolled && content} {...screenHeaderProps} />;
};
