import { type ReactNode } from 'react';
import { type LayoutChangeEvent, type ViewProps } from 'react-native';
import { type AnimatedProps } from 'react-native-reanimated';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedVStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeSpacing } from '@trezor/theme';

import { useDynamicHeader } from './DynamicScreenHeaderContext';
import { type ScreenHeaderProps } from '../ScreenHeader';

type DynamicScrollableScreenContentHeaderProps = {
    subtitle?: ReactNode;
    subtitleVariant?: 'body-sm' | 'body-md';
    marginBottom?: NativeSpacing;
    marginTop?: NativeSpacing;
    expandedContent?: ReactNode;
    contentEnteringAnimation?: AnimatedProps<ViewProps>['entering'];
    contentLayoutAnimation?: AnimatedProps<ViewProps>['layout'];
} & Pick<ScreenHeaderProps, 'title'>;

const headerStyle = prepareNativeStyle<{ insets: EdgeInsets }>((utils, { insets }) => ({
    paddingLeft: insets.left + utils.spacings.sp16,
    paddingRight: insets.right + utils.spacings.sp16,
}));

export const DynamicScrollableScreenContentHeader = ({
    title,
    subtitle,
    marginBottom = 'sp32',
    marginTop = 'sp16',
    expandedContent,
    subtitleVariant,
    contentEnteringAnimation,
    contentLayoutAnimation,
}: DynamicScrollableScreenContentHeaderProps) => {
    const { setScrollableHeaderHeight } = useDynamicHeader();
    const insets = useSafeAreaInsets();
    const { applyStyle } = useNativeStyles();

    const handleLayout = (e: LayoutChangeEvent) => {
        const { height } = e.nativeEvent.layout;
        setScrollableHeaderHeight(height);
    };

    return (
        <AnimatedVStack
            style={applyStyle(headerStyle, { insets })}
            marginTop={marginTop}
            marginBottom={marginBottom}
            onLayout={expandedContent ? handleLayout : undefined}
            entering={contentEnteringAnimation}
            layout={contentLayoutAnimation}
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
        </AnimatedVStack>
    );
};
