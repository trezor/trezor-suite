import { Box, Button, Card, HStack, Switch, Text, VStack } from '@suite-native/atoms';
import { Form, SelectField, TextInputField } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type SignMessageForm } from '../hooks/useSignMessageForm';

type SignMessageCardProps = {
    form: SignMessageForm;
};

const hexSwitchStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    alignSelf: 'flex-end',
    zIndex: 1,
}));

export const SignMessageCard = ({ form }: SignMessageCardProps) => {
    const {
        hookForm,
        formats,
        setFormat,
        addresses,
        setAddress,
        hex,
        setHex,
        submit,
        clear,
        isSigned,
    } = form;
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    return (
        <Card>
            <Form form={hookForm}>
                <VStack spacing="sp16">
                    {formats && (
                        <SelectField
                            name="format"
                            labelType="outsideLabel"
                            title={<Translation id="signAndVerify.format.label" />}
                            items={formats}
                            onSelectItem={setFormat}
                            isReadOnly={isSigned}
                        />
                    )}
                    <SelectField
                        name="address"
                        labelType="outsideLabel"
                        title={<Translation id="signAndVerify.address.label" />}
                        items={addresses}
                        onSelectItem={setAddress}
                        showCopyButton={isSigned}
                        isReadOnly={addresses.length === 1 || isSigned}
                    />
                    <Box>
                        <HStack style={applyStyle(hexSwitchStyle)}>
                            <Text>
                                <Translation id="signAndVerify.hex.label" />
                            </Text>
                            <Switch isChecked={hex} isDisabled={isSigned} onChange={setHex} />
                        </HStack>
                        <TextInputField
                            name="message"
                            labelType="outsideLabel"
                            label={translate('signAndVerify.message.label')}
                            showCopyButton={isSigned}
                            readOnly={isSigned}
                            multiline
                        />
                    </Box>
                    <TextInputField
                        name="signature"
                        labelType="outsideLabel"
                        label={translate('signAndVerify.signature.label')}
                        placeholder={translate('signAndVerify.signature.placeholder')}
                        showCopyButton={isSigned}
                        multiline
                        readOnly
                    />
                    {isSigned ? (
                        <Button onPress={clear} intent="neutral" priority="secondary">
                            <Translation id="signAndVerify.buttons.clear" />
                        </Button>
                    ) : (
                        <Button onPress={submit}>
                            <Translation id="signAndVerify.buttons.sign" />
                        </Button>
                    )}
                </VStack>
            </Form>
        </Card>
    );
};
