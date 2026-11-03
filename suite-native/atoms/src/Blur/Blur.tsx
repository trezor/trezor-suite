import { type ReactNode, createContext, useContext } from 'react';

import { Box, type BoxProps } from '../Box';
import { NativeBlurView } from './NativeBlurView';

export type BlurProps = BoxProps & {
    children: ReactNode;
    isBlurred?: boolean;
    blurIntensity?: number;
};

const BlurContext = createContext(false);

/** Blurs descendants without replacing their values or enabling redaction. */
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
