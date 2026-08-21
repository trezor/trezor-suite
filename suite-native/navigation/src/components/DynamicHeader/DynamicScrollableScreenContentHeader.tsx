import { type ReactNode } from 'react';
import { type LayoutChangeEvent } from 'react-native';

import { Text, VStack } from '@suite-native/atoms';
import { type NativeSpacing } from '@trezor/theme';

import { useDynamicHeader } from './DynamicScreenHeaderContext';
import { type ScreenHeaderProps } from '../ScreenHeader';

type DynamicScrollableScreenContentHeaderProps = {
    subtitle?: ReactNode;
    marginBottom?: NativeSpacing;
    expandedContent?: ReactNode;
} & Pick<ScreenHeaderProps, 'title'>;

export const DynamicScrollableScreenContentHeader = ({
    title,
    subtitle,
    marginBottom = 'sp32',
    expandedContent,
}: DynamicScrollableScreenContentHeaderProps) => {
    const { setScrollableHeaderHeight } = useDynamicHeader();

    const handleLayout = (e: LayoutChangeEvent) => {
        const { height } = e.nativeEvent.layout;
        setScrollableHeaderHeight(height);
    };

    return (
        <VStack
            paddingHorizontal="sp16"
            marginTop="sp16"
            marginBottom={marginBottom}
            onLayout={handleLayout}
        >
            {expandedContent ?? (
                <>
                    <Text variant="headline-md">{title}</Text>
                    {subtitle && <Text color="contentSecondary">{subtitle}</Text>}
                </>
            )}
        </VStack>
    );
};
