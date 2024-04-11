import { Form, TextInputField, useForm } from '@suite-native/forms';
import {
    passphraseFormSchema,
    PassphraseFormValues,
    formInputsMaxLength,
} from '@suite-common/validators';
import { Button, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

const formStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderBottomLeftRadius: utils.borders.radii.large,
    borderBottomRightRadius: utils.borders.radii.large,
}));

export const PassphraseForm = () => {
    const { applyStyle } = useNativeStyles();

    const form = useForm<PassphraseFormValues>({
        validation: passphraseFormSchema,
        defaultValues: {
            passphrase: '',
        },
    });

    const { handleSubmit } = form;

    const handleCreateHiddenWallet = handleSubmit(values => {
        console.warn(values);
        // TODO create wallet
    });

    return (
        <Form form={form}>
            <VStack spacing="medium" padding="medium" style={applyStyle(formStyle)}>
                <TextInputField
                    label="Passphrase"
                    name="passphrase"
                    maxLength={formInputsMaxLength.passphrase}
                    accessibilityLabel="passphrase input"
                    autoCapitalize="none"
                    secureTextEntry
                />
                <VStack>
                    <Button
                        accessibilityRole="button"
                        accessibilityLabel="confirm passphrase"
                        onPress={handleCreateHiddenWallet}
                    >
                        <Translation id="modulePassphrase.form.enterWallet" />
                    </Button>
                    <Button
                        accessibilityRole="button"
                        accessibilityLabel="cancel"
                        colorScheme="dangerElevation1"
                        onPress={() => null}
                    >
                        <Translation id="generic.buttons.close" />
                    </Button>
                </VStack>
            </VStack>
        </Form>
    );
};
