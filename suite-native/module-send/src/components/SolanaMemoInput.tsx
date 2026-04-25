import { useState } from 'react';

import { Button, HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type SendFieldName, type SendOutputsFormValues } from '../sendOutputsFormSchema';

const wrapperStyle = prepareNativeStyle(utils => ({
    gap: utils.spacings.sp12,
}));

export const SolanaMemoInput = () => {
    const [isMemoOpen, setIsMemoOpen] = useState(false);
    const { setValue } = useFormContext<SendOutputsFormValues>();
    const { applyStyle } = useNativeStyles();

    const memoFieldName: SendFieldName = 'destinationTag';

    const handleClose = () => {
        setValue(memoFieldName, '');
        setIsMemoOpen(false);
    };

    if (!isMemoOpen) {
        return (
            <Button
                iconLeft="tag"
                intent="neutral"
                priority="secondary"
                onPress={() => setIsMemoOpen(true)}
            >
                <Translation id="moduleSend.outputs.recipients.destinationTag.label" />
            </Button>
        );
    }

    return (
        <VStack style={applyStyle(wrapperStyle)}>
            <HStack justifyContent="space-between" alignItems="center">
                <Text variant="body-sm">
                    <Translation id="moduleSend.outputs.recipients.destinationTag.label" />
                </Text>
                <IconButton
                    iconName="x"
                    intent="neutral"
                    priority="secondary"
                    onPress={handleClose}
                />
            </HStack>
            <TextInputField name={memoFieldName} />
        </VStack>
    );
};
