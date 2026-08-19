import { type ReactNode } from 'react';
import { type LayoutChangeEvent } from 'react-native';

import { Text, VStack } from '@suite-native/atoms';
import { type NativeSpacing } from '@trezor/theme';

import { useDynamicHeader } from './DynamicScreenHeaderContext';
import { type ScreenHeaderProps } from '../ScreenHeader';

type DynamicScrollableScreenContentHeaderProps = {
    subtitle?: ReactNode;
    subtitleVariant?: 'body-sm' | 'body-md';
    marginBottom?: NativeSpacing;
    marginTop?: NativeSpacing;
    expandedContent?: ReactNode;
} & Pick<ScreenHeaderProps, 'title'>;

export const DynamicScrollableScreenContentHeader = ({
    title,
    subtitle,
    marginBottom = 'sp32',
    marginTop = 'sp16',
    expandedContent,
    subtitleVariant,
}: DynamicScrollableScreenContentHeaderProps) => {
    const { setScrollableHeaderHeight } = useDynamicHeader();

    const handleLayout = (e: LayoutChangeEvent) => {
        const { height } = e.nativeEvent.layout;
        setScrollableHeaderHeight(height);
    };

    return (
        <VStack
            paddingHorizontal="sp16"
            marginTop={marginTop}
            marginBottom={marginBottom}
            onLayout={expandedContent ? handleLayout : undefined}
        >
            {expandedContent || (
                <>
                    <Text onLayout={handleLayout} variant="headline-md">
                        {title}
                    </Text>
                    {subtitle && (
                        <Text variant={subtitleVariant} color="contentSecondary">
                            {subtitle}
                        </Text>
                    )}
                </>
            )}
        </VStack>
    );
};
