import { type ReactNode } from 'react';
import { type LayoutChangeEvent } from 'react-native';

import { Text, VStack } from '@suite-native/atoms';

import { useDynamicHeader } from './DynamicScreenHeaderContext';
import { type ScreenHeaderProps } from '../ScreenHeader';

type DynamicScrollableScreenContentHeaderProps = {
    subtitle?: ReactNode;
} & Pick<ScreenHeaderProps, 'title'>;

export const DynamicScrollableScreenContentHeader = ({
    title,
    subtitle,
}: DynamicScrollableScreenContentHeaderProps) => {
    const { setScrollableHeaderHeight } = useDynamicHeader();

    const handleLayout = (e: LayoutChangeEvent) => {
        const { height } = e.nativeEvent.layout;
        setScrollableHeaderHeight(height);
    };

    return (
        <VStack paddingHorizontal="sp16" marginTop="sp16" marginBottom="sp32">
            <Text variant="headline-md" onLayout={handleLayout}>
                {title}
            </Text>
            {subtitle && <Text color="contentSecondary">{subtitle}</Text>}
        </VStack>
    );
};
