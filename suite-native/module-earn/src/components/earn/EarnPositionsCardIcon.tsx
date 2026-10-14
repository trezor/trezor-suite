import { type ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export const MAX_VISIBLE_POSITION_ICONS = 3;

const iconWrapperStyle = prepareNativeStyle((utils, { index }: { index: number }) => ({
    marginLeft: index === 0 ? 0 : -utils.spacings.sp8,
    zIndex: MAX_VISIBLE_POSITION_ICONS - index,
}));

type EarnPositionsCardIconProps = {
    index: number;
    children: ReactNode;
};

export const EarnPositionsCardIcon = ({ index, children }: EarnPositionsCardIconProps) => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(iconWrapperStyle, { index })}>{children}</Box>;
};
