import { type ReactNode } from 'react';

import {
    RedactNumbersContext,
    useDiscreetMode,
    useShouldRedactNumbers,
} from '@suite-common/discreet-mode';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color, type NativeTypographyStyle } from '@trezor/theme';

import { Box, type BoxProps } from '../Box';
import { DiscreetPlaceholder } from './DiscreetPlaceholder';

const contentStyle = prepareNativeStyle<{ isConcealed: boolean }>((_, { isConcealed }) => ({
    opacity: isConcealed ? 0 : 1,
}));

export type DiscreetProps = BoxProps & {
    children: ReactNode;
    isForcedDiscreetMode?: boolean;
    blurIntensity?: number;
    color?: Color;
    placeholderVariant?: NativeTypographyStyle;
};

/** Conceals redacted descendants behind a synchronous blurred text placeholder. */
export const Discreet = ({
    children,
    isForcedDiscreetMode = false,
    blurIntensity = 4,
    color = 'contentPrimary',
    placeholderVariant = 'body-md',
    ...boxProps
}: DiscreetProps) => {
    const { applyStyle } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();
    const shouldRedactNumbers = useShouldRedactNumbers({ strict: false });
    const isConcealed = isDiscreetMode || isForcedDiscreetMode || shouldRedactNumbers;

    if (shouldRedactNumbers) {
        return <Box {...boxProps}>{children}</Box>;
    }

    return (
        <RedactNumbersContext.Provider value={{ shouldRedactNumbers: isConcealed }}>
            <Box testID={isConcealed ? 'discreet-text' : 'plain-text'} {...boxProps}>
                <Box
                    style={applyStyle(contentStyle, { isConcealed })}
                    pointerEvents={isConcealed ? 'none' : 'auto'}
                    accessibilityElementsHidden={isConcealed}
                    importantForAccessibility={isConcealed ? 'no-hide-descendants' : 'auto'}
                >
                    {children}
                </Box>
                {isConcealed && (
                    <DiscreetPlaceholder
                        color={color}
                        variant={placeholderVariant}
                        blurIntensity={blurIntensity}
                    />
                )}
            </Box>
        </RedactNumbersContext.Provider>
    );
};
