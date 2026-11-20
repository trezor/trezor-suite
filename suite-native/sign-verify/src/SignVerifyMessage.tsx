import { use } from 'react';

import { Box, HStack, Input, InputWrapper, Switch, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, SignVerifyFormContext } from './SignVerifyContext';
import { SignVerifyCopyButton } from './SignVerifyCopyButton';

const hexSwitchStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    alignSelf: 'flex-end',
    zIndex: 1,
}));

export const SignVerifyMessage = () => {
    const { page, outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const { values, errors, update } =
        use(SignVerifyFormContext) ?? throwError('Missing SignVerify form');

    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    const isCompleted = outcome === 'signed' || outcome === 'verified';

    return (
        <Box>
            {page === 'sign' && (
                <HStack style={applyStyle(hexSwitchStyle)}>
                    <Text>
                        <Translation id="signAndVerify.hex.label" />
                    </Text>
                    <Switch
                        isChecked={values.hex}
                        isDisabled={isCompleted}
                        onChange={hex => update({ hex })}
                    />
                </HStack>
            )}
            <InputWrapper label={translate('signAndVerify.message.label')} error={errors.message}>
                <Input
                    labelType="outsideLabel"
                    value={values.message}
                    onChangeText={message => update({ message })}
                    readOnly={isCompleted}
                    hasError={errors.message !== undefined || outcome === 'failed'}
                    rightIcon={isCompleted && <SignVerifyCopyButton value={values.message} />}
                    multiline
                />
            </InputWrapper>
        </Box>
    );
};
