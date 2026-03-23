import { StretchInY, StretchOutY } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { AnimatedBox, type BoxProps } from '@suite-native/atoms';
import { selectIsTradingResidenceCheckEnabled } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type ResidenceCheckAwareAnimatedBoxProps = Omit<BoxProps, 'style'>;

const pickerStyle = prepareNativeStyle<{ hasBorder: boolean }>(
    ({ borders, colors }, { hasBorder }) => ({
        extend: [
            {
                condition: hasBorder,
                style: {
                    borderTopWidth: borders.widths.small,
                    borderTopColor: colors.backgroundSurfaceElevation0,
                },
            },
        ],
    }),
);

export const ResidenceCheckAwareAnimatedBox = (props: ResidenceCheckAwareAnimatedBoxProps) => {
    const { applyStyle } = useNativeStyles();
    const isTradingResidenceCheckEnabled = useSelector(selectIsTradingResidenceCheckEnabled);

    return (
        <AnimatedBox
            style={applyStyle(pickerStyle, { hasBorder: !isTradingResidenceCheckEnabled })}
            entering={StretchInY}
            exiting={StretchOutY}
            {...props}
        />
    );
};
