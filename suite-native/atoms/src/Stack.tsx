import React, { type ReactNode } from 'react';
import { type ViewInstance } from 'react-native';
import Animated, { type AnimatedProps } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeSpacing } from '@trezor/theme';

import { Box, type BoxProps } from './Box';

type StackOrientation = 'horizontal' | 'vertical';
export interface StackProps extends BoxProps {
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

export const Stack: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<StackProps> & React.RefAttributes<ViewInstance>
> = React.forwardRef<ViewInstance, StackProps>(
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

export const VStack: typeof Stack = Stack;
export const HStack = (props: StackProps) => <Stack {...props} orientation="horizontal" />;

Stack.displayName = 'Stack';
VStack.displayName = 'VStack';
HStack.displayName = 'HStack';

export const AnimatedVStack: React.ComponentType<
    AnimatedProps<StackProps> & React.RefAttributes<ViewInstance>
> = Animated.createAnimatedComponent(VStack);
export const AnimatedHStack = Animated.createAnimatedComponent(HStack);
