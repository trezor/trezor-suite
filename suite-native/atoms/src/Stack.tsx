import { ReactNode } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { NativeSpacing } from '@trezor/theme';

import { Box, BoxProps } from './Box';

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
    const spacingValue = typeof spacing === 'number' ? spacing : utils.spacings[spacing ?? 'small'];
    const flexDirection = orientation === 'horizontal' ? 'row' : 'column';

    return {
        gap: spacingValue,
        flexDirection,
    };
});

export const Stack = ({
    children,
    style,
    spacing,
    orientation = 'vertical',
    ...rest
}: StackProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box
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
};

export const VStack = Stack;
export const HStack = (props: StackProps) => <Stack {...props} orientation="horizontal" />;
