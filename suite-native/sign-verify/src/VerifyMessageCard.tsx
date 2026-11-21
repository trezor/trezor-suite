import { Button, Card, VStack } from '@suite-native/atoms';
import { Form, TextInputField, type UseFormReturn } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';

import { type VerifyFormValues } from './SignVerifyFormValues';

type VerifyMessageCardProps = {
    form: UseFormReturn<VerifyFormValues>;
    isVerified: boolean;
    onVerify: () => void;
    onClear: () => void;
};

export const VerifyMessageCard = ({
    form,
    isVerified,
    onVerify,
    onClear,
}: VerifyMessageCardProps) => {
    const { translate } = useTranslate();

    return (
        <Card>
            <Form form={form}>
                <VStack spacing="sp16">
                    <TextInputField
                        name="address"
                        labelType="outsideLabel"
                        label={translate('signAndVerify.address.label')}
                        showCopyButton={isVerified}
                        readOnly={isVerified}
                    />
                    <TextInputField
                        name="message"
                        labelType="outsideLabel"
                        label={translate('signAndVerify.message.label')}
                        showCopyButton={isVerified}
                        readOnly={isVerified}
                        multiline
                    />
                    <TextInputField
                        name="signature"
                        labelType="outsideLabel"
                        label={translate('signAndVerify.signature.label')}
                        showCopyButton={isVerified}
                        readOnly={isVerified}
                        multiline
                    />
                    {isVerified ? (
                        <Button onPress={onClear} intent="neutral" priority="secondary">
                            <Translation id="signAndVerify.buttons.clear" />
                        </Button>
                    ) : (
                        <Button onPress={onVerify}>
                            <Translation id="signAndVerify.buttons.verify" />
                        </Button>
                    )}
                </VStack>
            </Form>
        </Card>
    );
};
