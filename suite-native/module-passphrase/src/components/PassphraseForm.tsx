import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Form, TextInputField, useForm } from '@suite-native/forms';
import {
    passphraseFormSchema,
    PassphraseFormValues,
    formInputsMaxLength,
} from '@suite-common/validators';
import { Button, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation, useTranslate } from '@suite-native/intl';

type PassphraseFormProps = {
    onFocus: () => void;
};

const formStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.large,
}));

export const PassphraseForm = ({ onFocus }: PassphraseFormProps) => {
    const { applyStyle } = useNativeStyles();

    const { translate } = useTranslate();

    const form = useForm<PassphraseFormValues>({
        validation: passphraseFormSchema,
        defaultValues: {
            passphrase: '',
        },
    });

    const { handleSubmit, watch } = form;

    const handleCreateHiddenWallet = handleSubmit(values => {
        console.warn(values);
        // TODO create wallet
    });

    const inputHasValue = !!watch('passphrase').length;

    return (
        <Form form={form}>
            <VStack spacing="medium" padding="medium" style={applyStyle(formStyle)}>
                <TextInputField
                    label={translate('modulePassphrase.form.inputLabel')}
                    name="passphrase"
                    maxLength={formInputsMaxLength.passphrase}
                    accessibilityLabel="passphrase input"
                    autoCapitalize="none"
                    onFocus={onFocus}
                    secureTextEntry
                />
                {inputHasValue && (
                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                        <Button
                            accessibilityRole="button"
                            accessibilityLabel="confirm passphrase"
                            onPress={handleCreateHiddenWallet}
                        >
                            <Translation id="modulePassphrase.form.enterWallet" />
                        </Button>
                    </Animated.View>
                )}
            </VStack>
        </Form>
    );
};
