import { type ReactNode } from 'react';

import { makeImageFromView } from '@shopify/react-native-skia';

import {
    RedactNumbersContext,
    useDiscreetMode,
    useShouldRedactNumbers,
} from '@suite-common/discreet-mode';

import { Box, type BoxProps } from '../Box';
import { BlurredContent } from './BlurredContent';

export type DiscreetProps = BoxProps & {
    children: ReactNode;
    isForcedDiscreetMode?: boolean;
    blurIntensity?: number;
};

/** Blurs rendered descendants; amount formatters redact numbers before rendering. */
export const Discreet = ({
    children,
    isForcedDiscreetMode = false,
    blurIntensity = 4,
    ...boxProps
}: DiscreetProps) => {
    const { isDiscreetMode } = useDiscreetMode();
    const shouldRedactNumbers = useShouldRedactNumbers({ strict: false });
    const isConcealed = isDiscreetMode || isForcedDiscreetMode || shouldRedactNumbers;

    return (
        <RedactNumbersContext.Provider value={{ shouldRedactNumbers: isConcealed }}>
            <Box testID={isConcealed ? 'discreet-text' : 'plain-text'} {...boxProps}>
                <BlurredContent
                    isBlurred={isConcealed}
                    blurIntensity={blurIntensity}
                    captureView={makeImageFromView}
                >
                    {children}
                </BlurredContent>
            </Box>
        </RedactNumbersContext.Provider>
    );
};
