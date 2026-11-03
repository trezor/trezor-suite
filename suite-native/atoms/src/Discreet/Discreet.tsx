import {
    RedactNumbersContext,
    useDiscreetMode,
    useShouldRedactNumbers,
} from '@suite-common/discreet-mode';
import { useNativeStyles } from '@trezor/styles-native';
import { type NativeTypographyStyle } from '@trezor/theme';

import { Blur, type BlurProps } from '../Blur/Blur';

export type DiscreetProps = Omit<BlurProps, 'isBlurred'> & {
    isForcedDiscreetMode?: boolean;
    /** Sizes the blur to this text variant unless blurIntensity is provided. */
    textVariant?: NativeTypographyStyle;
};

/**
 * Combines blur with the redaction context consumed by formatters.
 * Callers must redact any raw values before passing them here.
 */
export const Discreet = ({
    isForcedDiscreetMode = false,
    textVariant,
    blurIntensity,
    ...blurProps
}: DiscreetProps) => {
    const { isDiscreetMode } = useDiscreetMode();
    const isRedactedByParent = useShouldRedactNumbers({ strict: false });
    const {
        utils: { typography },
    } = useNativeStyles();
    const shouldRedactNumbers = isDiscreetMode || isForcedDiscreetMode || isRedactedByParent;
    const textBlurIntensity = textVariant ? typography[textVariant].lineHeight * 0.3 : undefined;

    return (
        <RedactNumbersContext.Provider value={{ shouldRedactNumbers }}>
            <Blur
                isBlurred={shouldRedactNumbers}
                blurIntensity={blurIntensity ?? textBlurIntensity}
                testID={shouldRedactNumbers ? 'discreet-text' : 'plain-text'}
                {...blurProps}
            />
        </RedactNumbersContext.Provider>
    );
};
