/* eslint-disable no-self-assign */
import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import {
    SharedValue,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import {
    Canvas,
    Circle,
    ColorMatrix,
    Group,
    ImageSVG,
    MatrixColorFilterProps,
    Paint,
    Paragraph,
    Path,
    Shadow,
    Skia,
    TextAlign,
    useSVG,
} from '@shopify/react-native-skia';

import { useNativeStyles } from '@trezor/styles';

const CANVAS_SIZE = 160;
const CIRCLE_DIAMETER = 128;
const CIRCLE_CENTER = CANVAS_SIZE / 2;

const PROGRESS_STROKE_WIDTH = 5;

const CHECKMARK_OFFSET_X = 10; // Adjust left/right position
const CHECKMARK_OFFSET_Y = 0; // Adjust up/down position
const CHECKMARK_SCALE = 1; // Adjust size
const LONG_LEG_RATIO = 0.25; // Reduce from 0.33 (1/3) to make long leg shorter

const checkmarkPath = Skia.Path.MakeFromSVGString(
    `M${CIRCLE_CENTER - CIRCLE_DIAMETER / 4 + CHECKMARK_OFFSET_X},${CIRCLE_CENTER + CHECKMARK_OFFSET_Y}` +
        `l${(CIRCLE_DIAMETER / 8) * CHECKMARK_SCALE},${(CIRCLE_DIAMETER / 8) * CHECKMARK_SCALE}` +
        `l${CIRCLE_DIAMETER * LONG_LEG_RATIO * CHECKMARK_SCALE},-${CIRCLE_DIAMETER * LONG_LEG_RATIO * CHECKMARK_SCALE}`,
)!;

const progressCirclePath = Skia.Path.MakeFromSVGString(
    `M ${CIRCLE_CENTER},${CIRCLE_CENTER - (CIRCLE_DIAMETER - PROGRESS_STROKE_WIDTH) / 2} A ${(CIRCLE_DIAMETER - PROGRESS_STROKE_WIDTH) / 2},${(CIRCLE_DIAMETER - PROGRESS_STROKE_WIDTH) / 2} 0 1,1 ${CIRCLE_CENTER},${CIRCLE_CENTER + (CIRCLE_DIAMETER - PROGRESS_STROKE_WIDTH) / 2} A ${(CIRCLE_DIAMETER - PROGRESS_STROKE_WIDTH) / 2},${(CIRCLE_DIAMETER - PROGRESS_STROKE_WIDTH) / 2} 0 1,1 ${CIRCLE_CENTER},${CIRCLE_CENTER - (CIRCLE_DIAMETER - PROGRESS_STROKE_WIDTH) / 2}`,
)!;

const fontStyle = {
    fontFamily: Platform.select({ ios: 'Helvetica', default: 'serif' }),
    fontSize: 34,
    letterSpacing: -1.4,
};

// For some reason you can't easily animate opacity of SVG image, so we need to do it manually.
const AnimatedOpacity = ({
    opacity,
    children,
}: {
    opacity: SharedValue<number>;
    children: React.ReactNode;
}) => {
    const matrix = useDerivedValue(
        // we can't use OpacityMatrix here because it's not worklet 😢
        () =>
            [
                1,
                0,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                opacity.value,
                0,
            ] as MatrixColorFilterProps['matrix'],
    );

    return (
        <Group
            layer={
                <Paint>
                    <ColorMatrix matrix={matrix} />
                </Paint>
            }
        >
            {children}
        </Group>
    );
};

export type UpdateProgressIndicatorStatus = 'starting' | 'success' | 'error' | 'inProgress';
export type UpdateProgressIndicatorProps = {
    progress: number;
    status: UpdateProgressIndicatorStatus;
};

// If you want to test animation states, use UpdateProgressIndicatorDemo, it will help you a lot.
export const UpdateProgressIndicator = ({
    progress,
    status,
}: {
    progress: number;
    status: UpdateProgressIndicatorStatus;
}) => {
    const checkmarkAnimationProgress = useSharedValue(0);
    const { utils } = useNativeStyles();
    const progressEnd = useSharedValue(progress / 100);
    const animatedBackgroundRadius = useSharedValue(0);
    const backgroundColorFinished = useSharedValue(utils.colors.textPrimaryDefault);
    const crossSvg = useSVG(require('@suite-common/icons/assets/x.svg'));
    const trezorLogoSvg = useSVG(require('@suite-common/icons/assets/trezorLogo.svg'));
    const trezorLogoOpacity = useSharedValue(1);
    const errorSvgOpacity = useSharedValue(0);
    const paragraphOpacity = useSharedValue(0);

    const isStarting = status === 'starting';
    const isSuccess = status === 'success';
    const isError = status === 'error';
    const isInProgress = status === 'inProgress';

    useEffect(() => {
        if (isStarting) {
            animatedBackgroundRadius.value = withTiming(0, { duration: 600 });
            backgroundColorFinished.value = backgroundColorFinished.value;

            checkmarkAnimationProgress.value = 0;
            progressEnd.value = withSpring(0);

            trezorLogoOpacity.value = withTiming(1, { duration: 600 });
            errorSvgOpacity.value = 0;
            paragraphOpacity.value = 0;
        }
        if (isInProgress) {
            animatedBackgroundRadius.value = withTiming(0, { duration: 600 });
            backgroundColorFinished.value = backgroundColorFinished.value;

            checkmarkAnimationProgress.value = 0;
            progressEnd.value = withSpring(progress / 100);

            trezorLogoOpacity.value = 0;
            errorSvgOpacity.value = 0;
            paragraphOpacity.value = withTiming(1, { duration: 600 });
        }
        if (isSuccess) {
            animatedBackgroundRadius.value = withSpring(CIRCLE_DIAMETER / 2);
            backgroundColorFinished.value = utils.colors.textPrimaryDefault;

            checkmarkAnimationProgress.value = withDelay(300, withSpring(1));
            progressEnd.value = 0;

            trezorLogoOpacity.value = 0;
            errorSvgOpacity.value = 0;
            paragraphOpacity.value = 0;
        }
        if (isError) {
            animatedBackgroundRadius.value = withSpring(CIRCLE_DIAMETER / 2);
            backgroundColorFinished.value = utils.colors.backgroundAlertRedBold;

            checkmarkAnimationProgress.value = 0;
            progressEnd.value = 0;

            trezorLogoOpacity.value = 0;
            errorSvgOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));
            paragraphOpacity.value = 0;
        }
    }, [
        progress,
        progressEnd,
        animatedBackgroundRadius,
        checkmarkAnimationProgress,
        isSuccess,
        isError,
        isStarting,
        backgroundColorFinished,
        utils.colors.backgroundAlertRedBold,
        utils.colors.textPrimaryDefault,
        isInProgress,
        trezorLogoOpacity,
        errorSvgOpacity,
        paragraphOpacity,
    ]);

    const paragraph = useMemo(() => {
        if (!isInProgress) return null;

        return Skia.ParagraphBuilder.Make({
            textAlign: TextAlign.Center,
        })
            .pushStyle({ ...fontStyle, color: Skia.Color(utils.colors.textPrimaryDefault) })
            .addText(`${progress}%`)
            .build();
    }, [progress, utils.colors.textPrimaryDefault, isInProgress]);

    const isDone = isSuccess || isError;

    return (
        <Canvas style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
            <Circle
                cx={CIRCLE_CENTER}
                cy={CIRCLE_CENTER}
                r={CIRCLE_DIAMETER / 2}
                color={utils.colors.backgroundSurfaceElevation1}
            ></Circle>

            {isInProgress && (
                <AnimatedOpacity opacity={paragraphOpacity}>
                    <Paragraph
                        paragraph={paragraph}
                        x={0}
                        y={CIRCLE_CENTER - fontStyle.fontSize / 2}
                        width={CANVAS_SIZE}
                    />
                </AnimatedOpacity>
            )}

            <AnimatedOpacity opacity={trezorLogoOpacity}>
                <ImageSVG
                    svg={trezorLogoSvg}
                    x={CIRCLE_CENTER - CIRCLE_DIAMETER / 4}
                    y={CIRCLE_CENTER - CIRCLE_DIAMETER / 4}
                    color={utils.colors.textPrimaryDefault}
                    width={CIRCLE_DIAMETER / 2}
                    height={CIRCLE_DIAMETER / 2}
                    opacity={trezorLogoOpacity}
                />
            </AnimatedOpacity>

            <Group>
                <Path
                    path={progressCirclePath}
                    start={0}
                    end={progressEnd}
                    color={utils.colors.textPrimaryDefault}
                    strokeCap="round"
                    strokeJoin="round"
                    strokeWidth={PROGRESS_STROKE_WIDTH}
                    style="stroke"
                >
                    {!isDone && <Shadow dx={0} dy={2} blur={4} color="rgba(0,0,0,0.1)" />}
                </Path>
            </Group>
            <Circle
                cx={CIRCLE_CENTER}
                cy={CIRCLE_CENTER}
                r={animatedBackgroundRadius}
                color={backgroundColorFinished}
            />
            {isSuccess && (
                <Path
                    path={checkmarkPath}
                    color={utils.colors.backgroundSurfaceElevation1}
                    start={0}
                    end={checkmarkAnimationProgress}
                    strokeCap="round"
                    strokeJoin="round"
                    strokeWidth={3}
                    style="stroke"
                />
            )}
            {isError && (
                <AnimatedOpacity opacity={errorSvgOpacity}>
                    <ImageSVG
                        svg={crossSvg}
                        x={CIRCLE_CENTER - CIRCLE_DIAMETER / 4}
                        y={CIRCLE_CENTER - CIRCLE_DIAMETER / 4}
                        color={utils.colors.backgroundAlertRedBold}
                        width={CIRCLE_DIAMETER / 2}
                        height={CIRCLE_DIAMETER / 2}
                    />
                </AnimatedOpacity>
            )}
        </Canvas>
    );
};
