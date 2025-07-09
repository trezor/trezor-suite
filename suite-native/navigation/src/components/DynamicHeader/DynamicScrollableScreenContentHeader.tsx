import { ReactNode } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { Box, Text } from '@suite-native/atoms';

import { useDynamicHeader } from './DynamicScreenHeaderContext';

type DynamicScrollableScreenContentHeaderProps = {
    content?: ReactNode;
    subtitle?: ReactNode;
};

export const DynamicScrollableScreenContentHeader = ({
    content,
    subtitle,
}: DynamicScrollableScreenContentHeaderProps) => {
    const { setScrollableHeaderHeight } = useDynamicHeader();

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
