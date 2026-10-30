import { type ReactNode, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, type View } from 'react-native';

import {
    Blur,
    Canvas,
    Image,
    type SkImage,
    type makeImageFromView,
} from '@shopify/react-native-skia';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';

const contentStyle = prepareNativeStyle<{ isBlurred: boolean }>((_, { isBlurred }) => ({
    opacity: isBlurred ? 0 : 1,
}));

const canvasStyle = prepareNativeStyle<{ width: number; height: number; padding: number }>(
    (_, { width, height, padding }) => ({
        position: 'absolute',
        top: -padding,
        left: -padding,
        width: width + padding * 2,
        height: height + padding * 2,
    }),
);

type BlurredContentProps = {
    children: ReactNode;
    isBlurred: boolean;
    blurIntensity: number;
    captureView: typeof makeImageFromView;
};

/** Captures only concealed content; the image stays in memory and is never persisted. */
export const BlurredContent = ({
    children,
    isBlurred,
    blurIntensity,
    captureView,
}: BlurredContentProps) => {
    const contentRef = useRef<View>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [image, setImage] = useState<SkImage | null>(null);
    const { applyStyle, utils } = useNativeStyles();
    const padding = Math.ceil(blurIntensity * 3);

    useEffect(() => {
        if (!isBlurred) {
            setImage(null);

            return;
        }
        if (size.width === 0 || size.height === 0) return;

        let cancelled = false;
        const frame = requestAnimationFrame(() => {
            // Capture the inner view at full opacity while its parent keeps it off screen.
            captureView(contentRef).then(
                snapshot => {
                    if (!cancelled) setImage(snapshot);
                },
                () => {
                    // A failed capture must never reveal the unblurred content.
                    if (!cancelled) setImage(null);
                },
            );
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
        };
    }, [captureView, children, isBlurred, size.width, size.height, utils.colors]);

    const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
        setSize(current =>
            current.width === layout.width && current.height === layout.height
                ? current
                : { width: layout.width, height: layout.height },
        );
    };

    return (
        <Box
            pointerEvents={isBlurred ? 'none' : 'auto'}
            accessibilityElementsHidden={isBlurred}
            importantForAccessibility={isBlurred ? 'no-hide-descendants' : 'auto'}
        >
            <Box style={applyStyle(contentStyle, { isBlurred })}>
                <Box
                    ref={contentRef}
                    collapsable={false}
                    onLayout={onLayout}
                    testID="discreet-content"
                >
                    {children}
                </Box>
            </Box>
            {isBlurred && (
                <Canvas style={applyStyle(canvasStyle, { ...size, padding })} accessible={false}>
                    <Image
                        image={image}
                        x={padding}
                        y={padding}
                        width={size.width}
                        height={size.height}
                    >
                        <Blur blur={blurIntensity} mode="decal" />
                    </Image>
                </Canvas>
            )}
        </Box>
    );
};
