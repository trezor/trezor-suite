import { type ReactNode, useContext } from 'react';

import { Box, type BoxProps } from '../Box';
import { BlurContext } from './BlurContext';
import { NativeBlurView } from './NativeBlurView';

export type BlurProps = BoxProps & {
    children: ReactNode;
    isBlurred?: boolean;
    blurIntensity?: number;
};

/**
 * Blurs box content without replacing its values or enabling redaction.
 * Use [BlurText](../BlurText/BlurText.tsx) for inline text to preserve its baseline and wrapping.
 */
export const Blur = ({ children, isBlurred = true, blurIntensity = 4, ...boxProps }: BlurProps) => {
    const isBlurredByParent = useContext(BlurContext);

    if (isBlurredByParent) {
        return <Box {...boxProps}>{children}</Box>;
    }

    return (
        <BlurContext.Provider value={isBlurred}>
            <Box {...boxProps}>
                <NativeBlurView
                    testID="blur-native"
                    isBlurred={isBlurred}
                    blurIntensity={blurIntensity}
                    pointerEvents={isBlurred ? 'none' : 'auto'}
                    accessibilityElementsHidden={isBlurred}
                    importantForAccessibility={isBlurred ? 'no-hide-descendants' : 'auto'}
                >
                    {children}
                </NativeBlurView>
            </Box>
        </BlurContext.Provider>
    );
};
