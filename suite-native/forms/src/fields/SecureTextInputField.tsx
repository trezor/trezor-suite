import { forwardRef, useState } from 'react';
import { Pressable } from 'react-native';

import { type InputType } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';

import { type FieldProps, TextInputField } from './TextInputField';

type ToggleSecureTextIconProps = {
    onPress: () => void;
    isTextHidden: boolean;
};

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
            />
        );
    },
);
