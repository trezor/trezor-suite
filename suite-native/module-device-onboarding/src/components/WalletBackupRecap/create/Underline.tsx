import { PixelRatio } from 'react-native';
import {
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AnimatedBox, Box, useIllustrationColors } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const containerStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    bottom: 3,
    left: 0,
    zIndex: -1,
}));

const maskStyle = prepareNativeStyle(utils => ({
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

type UnderlineProps = {
    isFocused: SharedValue<boolean>;
};

const PATH_WIDTH = 83;
const ANIMATED_DURATION = 800;
const ANIMATED_DELAY = 400;

export const Underline = ({ isFocused }: UnderlineProps) => {
    const hasAnimationRun = useSharedValue(false);
    const { lineColor } = useIllustrationColors();
    const fontScale = PixelRatio.getFontScale();
    const { applyStyle } = useNativeStyles();
    const scaledWidth = PATH_WIDTH * fontScale;

    const maskAnimatedStyle = useAnimatedStyle(() => {
        if (hasAnimationRun.value) {
            return {
                transform: [
                    {
                        translateX: scaledWidth,
                    },
                ],
            };
        }

        return {
            transform: [
                {
                    translateX: isFocused.value
                        ? withDelay(
                              ANIMATED_DELAY,
                              withTiming(scaledWidth, { duration: ANIMATED_DURATION }, () => {
                                  hasAnimationRun.value = true;
                              }),
                          )
                        : 0,
                },
            ],
        };
    });

    return (
        <Box style={applyStyle(containerStyle)}>
            <Svg
                width={scaledWidth}
                height={4}
                fill="none"
                style={{ transform: [{ scaleX: fontScale }], transformOrigin: 'left' }}
            >
                <Path
                    fill={lineColor}
                    d="M82.514 3.378C47.333-.475 0 4 0 4v-.621S47.146-2.76 82.536 1.51c.633.077.612 1.936-.022 1.867Z"
                />
            </Svg>
            <AnimatedBox style={[applyStyle(maskStyle), maskAnimatedStyle]} />
        </Box>
    );
};
