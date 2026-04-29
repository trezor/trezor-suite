import { forwardRef, useState } from 'react';
import { Platform, Pressable } from 'react-native';

import { type InputType } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type FieldProps, TextInputField } from './TextInputField';

type ToggleSecureTextIconProps = {
    onPress: () => void;
    isTextHidden: boolean;
};

// Ensures that the caps lock indicator shown on iOS doesn't overlap with the right icon.
const inputStyle = prepareNativeStyle(({ spacings }) => ({
    marginRight: Platform.OS === 'ios' ? spacings.sp16 : 0,
}));

const ToggleSecureTextIcon = ({ onPress, isTextHidden }: ToggleSecureTextIconProps) => {
    const iconName: IconName = isTextHidden ? 'eye' : 'eyeSlash';

    return (
        <Pressable onPress={onPress}>
            <Icon name={iconName} color="contentSecondary" size="large" />
        </Pressable>
    );
};

export const SecureTextInputField = forwardRef<InputType, FieldProps>(
    ({ ...textInputFieldProps }, ref) => {
        const [isTextHidden, setIsTextHidden] = useState(true);
        const { applyStyle } = useNativeStyles();

        return (
            <TextInputField
                {...textInputFieldProps}
                ref={ref}
                rightIcon={
                    <ToggleSecureTextIcon
                        isTextHidden={isTextHidden}
                        onPress={() => setIsTextHidden(!isTextHidden)}
                    />
                }
                secureTextEntry={isTextHidden}
                // We want to prevent secure inputs from interacting with any password managers and autofill.
                // Passphrases or other crypto secrets should be never saved anywhere!
                importantForAutofill="no"
                autoComplete="off"
                textContentType="oneTimeCode"
                style={applyStyle(inputStyle)}
            />
        );
    },
);
