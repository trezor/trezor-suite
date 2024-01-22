import { Form, useForm } from '@suite-native/forms';
import { Card, HStack, VStack, Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';
import { PinFormValues, pinFormSchema } from '@suite-common/validators';

import { PinMatrixButton } from './PinMatrixButton';
import { PinFormProgress } from './PinFormProgress';
import { PinFormControlButtons } from './PinFormControlButtons';

const pinMatrix = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
];

const cardStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.small,
    padding: 40,
}));

const pinProgressWrapperStyle = prepareNativeStyle(utils => ({
    height: utils.spacings.extraLarge,
    justifyContent: 'center',
}));

export const PinForm = () => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const form = useForm<PinFormValues>({
        validation: pinFormSchema,

        defaultValues: {
            pin: '',
        },
    });

    return (
        <Form form={form}>
            <VStack spacing="small" alignItems="center">
                <Text color="textSubdued">
                    {translate('moduleConnectDevice.pinScreen.form.keypadInfo')}
                </Text>
                <Box style={applyStyle(pinProgressWrapperStyle)}>
                    <PinFormProgress />
                </Box>
            </VStack>
            <Card style={applyStyle(cardStyle)}>
                <VStack justifyContent="center" alignItems="center" spacing="large">
                    {pinMatrix.map(pinRow => (
                        <HStack key={pinRow.join('')} spacing="medium">
                            {pinRow.map(value => (
                                <PinMatrixButton key={value} value={value} />
                            ))}
                        </HStack>
                    ))}
                    <PinFormControlButtons />
                </VStack>
            </Card>
        </Form>
    );
};
