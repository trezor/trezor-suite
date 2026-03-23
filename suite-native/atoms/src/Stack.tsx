import React, { type ReactNode } from 'react';
import { type View } from 'react-native';
import Animated, { type AnimatedProps } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeSpacing } from '@trezor/theme';

import { Box, type BoxProps } from './Box';

type StackOrientation = 'horizontal' | 'vertical';
interface StackProps extends BoxProps {
    children: ReactNode;
    spacing?: NativeSpacing | number;
    orientation?: StackOrientation;
}

type SpacerStyleProps = {
    spacing?: NativeSpacing | number;
    orientation?: StackOrientation;
};

const spacerStyle = prepareNativeStyle<SpacerStyleProps>((utils, { spacing, orientation }) => {
    const spacingValue = typeof spacing === 'number' ? spacing : utils.spacings[spacing ?? 'sp8'];
    const flexDirection = orientation === 'horizontal' ? 'row' : 'column';

    return {
        gap: spacingValue,
        flexDirection,
    };
});

export const Stack = React.forwardRef<View, StackProps>(
    ({ children, style, spacing, orientation = 'vertical', ...rest }: StackProps, ref) => {
        const { applyStyle } = useNativeStyles();

        return (
            <Box
                ref={ref}
                style={[
                    applyStyle(spacerStyle, {
                        spacing,
                        orientation,
                    }),
                    style,
                ]}
                {...rest}
            >
                {children}
            </Box>
        );
    },
);

export const VStack = Stack;
export const HStack = (props: StackProps) => <Stack {...props} orientation="horizontal" />;

const AnimatedStack = Object.assign(Animated.createAnimatedComponent(Stack), {
    displayName: 'AnimatedStack',
});
export const AnimatedVStack = AnimatedStack;
export const AnimatedHStack = (props: AnimatedProps<StackProps>) => (
    <AnimatedStack {...props} orientation="horizontal" />
);
