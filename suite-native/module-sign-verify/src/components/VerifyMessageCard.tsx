import { Button, Card, VStack } from '@suite-native/atoms';
import { Form, TextInputField } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';

import { type VerifyMessageForm } from '../hooks/useVerifyMessageForm';

type VerifyMessageCardProps = {
    form: VerifyMessageForm;
};

export const VerifyMessageCard = ({ form }: VerifyMessageCardProps) => {
    const { hookForm, submit, clear, isVerified } = form;
    const { translate } = useTranslate();

    return (
        <Card>
            <Form form={hookForm}>
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
                        <Button onPress={clear} intent="neutral" priority="secondary">
                            <Translation id="signAndVerify.buttons.clear" />
                        </Button>
                    ) : (
                        <Button onPress={submit}>
                            <Translation id="signAndVerify.buttons.verify" />
                        </Button>
                    )}
                </VStack>
            </Form>
        </Card>
    );
};
