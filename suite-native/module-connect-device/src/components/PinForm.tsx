import { Form, useForm } from '@suite-native/forms';
import { Button, Card, HStack, IconButton, VStack, Box } from '@suite-native/atoms';
import { yup } from '@trezor/validation';

import { PinMatrixButton } from './PinMatrixButton';
import { PinProgress } from './PinProgress';

const pinFormSchema = yup.object({
    pin: yup
        .string()
        .required('Empty pin.')
        .matches(/^\d{1,50}$/, 'The number should have up to 50 digits.'),
});

type PinFormValues = yup.InferType<typeof pinFormSchema>;

export const PinForm = () => {
    const form = useForm<PinFormValues>({
        validation: pinFormSchema,
        defaultValues: {
            pin: '',
        },
    });

    const { handleSubmit, watch, setValue, getValues } = form;

    const onSubmit = handleSubmit(values => console.log(values, 'submit'));

    const handleDelete = () => {
        const pin = getValues('pin');
        setValue('pin', pin.slice(0, -1));
    };

    const pinLength = watch('pin').length;

    return (
        <Form form={form}>
            <Box style={{ height: 32 }}>
                <PinProgress pinLength={pinLength} />
            </Box>
            <Card style={{ justifyContent: 'center' }}>
                <VStack justifyContent="center">
                    <HStack spacing="medium">
                        <PinMatrixButton value={7} />
                        <PinMatrixButton value={8} />
                        <PinMatrixButton value={9} />
                    </HStack>
                    <HStack spacing="medium">
                        <PinMatrixButton value={4} />
                        <PinMatrixButton value={5} />
                        <PinMatrixButton value={6} />
                    </HStack>
                    <HStack spacing="medium">
                        <PinMatrixButton value={1} />
                        <PinMatrixButton value={2} />
                        <PinMatrixButton value={3} />
                    </HStack>
                    <HStack spacing="medium">
                        {!!pinLength && (
                            <IconButton
                                onPress={handleDelete}
                                iconName="backspace"
                                colorScheme="tertiaryElevation0"
                            />
                        )}
                        <Box flex={1}>
                            <Button onPress={onSubmit}>Enter pin</Button>
                        </Box>
                    </HStack>
                </VStack>
            </Card>
        </Form>
    );
};
