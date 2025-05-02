import { Platform, Vibration } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
    SharedValue,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';

import { AnimatedVStack, Text } from '@suite-native/atoms';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles';
const CANVAS_SIZE = 88;
const CIRCLE_CENTER = CANVAS_SIZE / 2;
const BORDER_WIDTH = 2;
const DEFAULT_BUTTON_RADIUS = 12;

const BUTTON_ANIMATION_DURATION = 1500;
const ENTERING_ANIMATION_DURATION = 300;
const ANIMATION_DELAY = 4500; // The button is displayed after the cards animation is finished.

const LOADER_ARC_OVAL_CONFIG = {
    x: BORDER_WIDTH,
    y: BORDER_WIDTH,
    width: CANVAS_SIZE - BORDER_WIDTH * 2,
    height: CANVAS_SIZE - BORDER_WIDTH * 2,
};

type HoldToConfirmButtonProps = {
    onSuccess: () => void;
    isDisplayed?: SharedValue<boolean>;
    buttonLabelId?: TxKeyPath;
};

const GESTURE_HIT_SLOP = 20;
const SUCCESS_VIBRATION_DURATION = 200;

const leftLoaderArcPath = Skia.Path.Make();
leftLoaderArcPath.addArc(LOADER_ARC_OVAL_CONFIG, 90, 180);

const rightLoaderArcPath = Skia.Path.Make();
rightLoaderArcPath.addArc(LOADER_ARC_OVAL_CONFIG, 90, -180);

const startOnHoldVibration = () => {
    if (Platform.OS === 'ios') {
        // on iOS the vibration maximum duration is 400ms, so we need to use a repeated pattern to make it as close as possible to continual vibration.
        // more here: https://reactnative.dev/docs/vibration
        Vibration.vibrate([10], true);
    } else {
        // stop vibration 100ms before the animation ends so the follow up vibration is more prominent.
        Vibration.vibrate(BUTTON_ANIMATION_DURATION - 100);
    }
};

export const HoldToConfirmButton = ({
    onSuccess,
    isDisplayed,
    buttonLabelId = 'moduleDeviceOnboarding.walletBackupTutorialScreen.step6.holdToConfirmButton',
}: HoldToConfirmButtonProps) => {
    const { utils } = useNativeStyles();

    const animationProgress = useSharedValue(0);

    const animatedButtonRadius = useDerivedValue(
        () =>
            DEFAULT_BUTTON_RADIUS +
            (CANVAS_SIZE / 2 - DEFAULT_BUTTON_RADIUS - BORDER_WIDTH) * animationProgress.value,
    );

    const tapGesture = Gesture.LongPress()
        .hitSlop({
            top: GESTURE_HIT_SLOP,
            bottom: GESTURE_HIT_SLOP,
            left: GESTURE_HIT_SLOP,
            right: GESTURE_HIT_SLOP,
        })
        .onBegin(() => {
            runOnJS(startOnHoldVibration)();
            animationProgress.value = withTiming(1, { duration: BUTTON_ANIMATION_DURATION });
        })
        .onFinalize(() => {
            runOnJS(Vibration.cancel)();
            animationProgress.value = withTiming(0, {
                duration: BUTTON_ANIMATION_DURATION * animationProgress.value,
            });
        });

    useAnimatedReaction(
        () => animationProgress.value,
        (value, prevValue) => {
            if (value === 1 && value !== prevValue) {
                runOnJS(Vibration.vibrate)(SUCCESS_VIBRATION_DURATION);
                runOnJS(onSuccess)();
            }
        },
    );

    const buttonAnimatedStyle = useAnimatedStyle(() => {
        if (isDisplayed?.value === undefined) return { opacity: 1 };

        if (!isDisplayed.value) {
            return {
                opacity: 0,
            };
        }

        return {
            opacity: withDelay(
                ANIMATION_DELAY,
                withTiming(1, {
                    duration: ENTERING_ANIMATION_DURATION,
                }),
            ),
        };
    });

    return (
        <AnimatedVStack style={buttonAnimatedStyle} alignItems="center">
            <Text variant="callout">
                <Translation id={buttonLabelId} />
            </Text>
            <GestureDetector gesture={tapGesture}>
                <Canvas style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
                    <Circle
                        cx={CIRCLE_CENTER}
                        cy={CIRCLE_CENTER}
                        r={CANVAS_SIZE / 2}
                        color={utils.colors.borderOnElevation0}
                    />
                    <Circle
                        cx={CIRCLE_CENTER}
                        cy={CIRCLE_CENTER}
                        r={CANVAS_SIZE / 2 - BORDER_WIDTH}
                        color={utils.colors.backgroundSurfaceElevationNegative}
                    />
                    <Circle
                        cx={CIRCLE_CENTER}
                        cy={CIRCLE_CENTER}
                        r={animatedButtonRadius}
                        color={utils.colors.backgroundPrimaryDefault}
                    />
                    <Path
                        path={leftLoaderArcPath}
                        color={utils.colors.backgroundPrimaryDefault}
                        start={0}
                        end={animationProgress}
                        strokeCap="round"
                        strokeJoin="round"
                        strokeWidth={BORDER_WIDTH}
                        style="stroke"
                    />
                    <Path
                        path={rightLoaderArcPath}
                        color={utils.colors.backgroundPrimaryDefault}
                        start={0}
                        end={animationProgress}
                        strokeCap="round"
                        strokeJoin="round"
                        strokeWidth={BORDER_WIDTH}
                        style="stroke"
                    />
                </Canvas>
            </GestureDetector>
        </AnimatedVStack>
    );
};
