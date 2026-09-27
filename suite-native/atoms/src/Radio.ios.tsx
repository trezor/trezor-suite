import { View } from 'react-native';

import { Button, Host, Image } from '@expo/ui/swift-ui';
import {
    accessibilityAddTraits,
    accessibilityHidden,
    buttonStyle,
    contentShape,
    font,
    frame,
    accessibilityLabel as nativeAccessibilityLabel,
    disabled as nativeDisabled,
    shapes,
} from '@expo/ui/swift-ui/modifiers';

import { isDarkColor, useNativeStyles } from '@trezor/styles-native';

import { DecorativeControl } from './DecorativeControl';
import { LegacyRadio } from './LegacyRadio';
import { isNativeRadioSupported } from './isNativeRadioSupported';
import { type RadioIndicatorProps, type RadioProps } from './radioTypes';

export type { RadioIndicatorProps, RadioProps } from './radioTypes';

const RadioImage = ({
    isChecked = false,
    isDisabled = false,
    isInteractive = false,
}: RadioIndicatorProps & { isInteractive?: boolean }) => {
    const {
        utils: { colors },
    } = useNativeStyles();
    const enabledColor = isChecked ? colors.elementFillFieldSelected : colors.contentSecondary;

    return (
        <Image
            systemName={isChecked ? 'checkmark.circle.fill' : 'circle'}
            color={isDisabled ? colors.contentDisabled : enabledColor}
            modifiers={[
                font({ textStyle: 'title2' }),
                frame({ minWidth: isInteractive ? 44 : 28, minHeight: isInteractive ? 44 : 28 }),
                contentShape(shapes.rectangle()),
                accessibilityHidden(),
            ]}
        />
    );
};

const NativeRadio = <TValue extends string | number>({
    value,
    onPress,
    isChecked = false,
    isDisabled = false,
    disabled = isDisabled,
    accessibilityLabel,
    testID,
    style,
}: RadioProps<TValue>) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    return (
        <View style={style}>
            <Host
                matchContents
                colorScheme={isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light'}
                ignoreSafeArea="all"
            >
                <Button
                    testID={testID}
                    onPress={() => {
                        if (!disabled) onPress(value);
                    }}
                    modifiers={[
                        buttonStyle('plain'),
                        nativeDisabled(disabled),
                        accessibilityAddTraits(isChecked ? ['isSelected'] : []),
                        ...(accessibilityLabel
                            ? [nativeAccessibilityLabel(accessibilityLabel)]
                            : []),
                    ]}
                >
                    <RadioImage isChecked={isChecked} isDisabled={disabled} isInteractive />
                </Button>
            </Host>
        </View>
    );
};

export const Radio = <TValue extends string | number>(props: RadioProps<TValue>) =>
    isNativeRadioSupported(props) ? <NativeRadio {...props} /> : <LegacyRadio {...props} />;

export const RadioIndicator = ({ style, testID, ...props }: RadioIndicatorProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    return (
        <View style={style} testID={testID}>
            <DecorativeControl>
                <Host
                    matchContents
                    colorScheme={isDarkColor(colors.surfaceFillPage) ? 'dark' : 'light'}
                    ignoreSafeArea="all"
                >
                    <RadioImage {...props} />
                </Host>
            </DecorativeControl>
        </View>
    );
};
