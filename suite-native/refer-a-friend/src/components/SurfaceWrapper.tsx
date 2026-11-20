import { type ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type SurfaceWrapperProps = {
    children: ReactNode;
};

const wrapperStyle = prepareNativeStyle(({ borders, colors }) => ({
    borderRadius: borders.radii.r12,
    backgroundColor: colors.surfaceFillRaised,
}));

export const SurfaceWrapper = ({ children }: SurfaceWrapperProps) => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(wrapperStyle)}>{children}</Box>;
};
