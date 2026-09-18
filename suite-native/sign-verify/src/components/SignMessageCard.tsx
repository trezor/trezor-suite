import type { Account } from '@suite-common/wallet-types';
import { Box, Button, Card, HStack, Select, Switch, Text, VStack } from '@suite-native/atoms';
import { Form, SelectField, TextInputField } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';

import { type SignatureFormat, useSignMessageForm } from '../hooks/useSignMessageForm';

type SignMessageCardProps = {
    account: Account;
};

// TODO: Rename to SignMessageSubTab?
export const SignMessageCard = ({ account }: SignMessageCardProps) => {
    const {
        hookForm,
        formats,
        selectedFormat,
        setFormat,
        addresses,
        selectedAddress,
        setAddress,
        isMessageHex,
        toggleMessageHex,
        submit,
    } = useSignMessageForm(account);
    const { translate } = useTranslate();

    return (
        <Card>
            <Form form={hookForm}>
                <VStack spacing="sp16">
                    {formats && (
                        <SelectField<SignatureFormat>
                            name="format"
                            title={<Translation id="signAndVerify.format.label" />}
                            items={formats}
                            value={selectedFormat}
                            onSelectItem={setFormat}
                            isLabelShown
                        />
                    )}
                    <SelectField
                        name="address"
                        title={<Translation id="signAndVerify.address.label" />}
                        items={addresses}
                        value={selectedAddress}
                        onSelectItem={setAddress}
                        isLabelShown
                    />
                    <Box>
                        <HStack alignSelf="flex-end" style={{ position: 'absolute', zIndex: 1 }}>
                            <Text>Hex</Text>
                            <Switch isChecked={isMessageHex} onChange={toggleMessageHex} />
                        </HStack>
                        <TextInputField
                            name="message"
                            labelType="outsideLabel"
                            label={translate('signAndVerify.message.label')}
                            multiline
                        />
                    </Box>
                    <TextInputField
                        name="signature"
                        labelType="outsideLabel"
                        label={translate('signAndVerify.signature.label')}
                        placeholder={translate('signAndVerify.signature.placeholder')}
                        multiline
                        readOnly
                    />
                    <Button onPress={submit}>
                        <Translation id="signAndVerify.buttons.sign" />
                    </Button>
                </VStack>
            </Form>
        </Card>
    );
};
