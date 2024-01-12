import { Form, useForm } from '@suite-native/forms';
import { Card, HStack, VStack, Box, Text } from '@suite-native/atoms';
import { yup } from '@trezor/validation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';

import { PinMatrixButton } from './PinMatrixButton';
import { PinFormProgress } from './PinFormProgress';
import { PIN_FORM_MAX_LENGTH, PIN_FORM_MIN_LENGTH } from '../constants';
import { PinFormControlButtons } from './PinFormControlButtons';

const pinMatrix = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
];

const pinFormSchema = yup.object({
    pin: yup.string().required('Empty pin.').max(PIN_FORM_MAX_LENGTH).min(PIN_FORM_MIN_LENGTH),
});

type PinFormValues = yup.InferType<typeof pinFormSchema>;

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
                <Text color="textSubdued">{translate('device.pinScreen.form.keypadInfo')}</Text>
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
