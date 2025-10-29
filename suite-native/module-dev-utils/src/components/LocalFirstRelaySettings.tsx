import { useDispatch, useSelector } from 'react-redux';

import {
    labelingActions,
    selectLocalFirstStorageRelayUrl,
} from '@suite-common/local-first-storage';
import { yup } from '@suite-common/validators';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';

export const LocalFirstRelaySettings = () => {
    const localFirstStorageRelayUrl = useSelector(selectLocalFirstStorageRelayUrl);
    const dispatch = useDispatch();

    const form = useForm<{ localFirstStorageRelayUrl: string }>({
        defaultValues: {
            localFirstStorageRelayUrl: localFirstStorageRelayUrl ?? '',
        },
        validation: yup.object({
            localFirstStorageRelayUrl: yup.string(),
        }),
    });

    const onSubmit = form.handleSubmit(values => {
        dispatch(
            labelingActions.setLocalFirstStorageRelayUrl({ url: values.localFirstStorageRelayUrl }),
        );
        form.reset(values);
    });

    return (
        <Card>
            <VStack paddingTop="sp16">
                <Text variant="highlight">Local first relay URL</Text>
                <VStack spacing="sp8">
                    <Form form={form}>
                        <TextInputField
                            name="localFirstStorageRelayUrl"
                            placeholder="Enter custom relay URL"
                        />
                        <Button colorScheme="tertiaryElevation0" size="small" onPress={onSubmit}>
                            Save
                        </Button>
                    </Form>
                </VStack>
            </VStack>
        </Card>
    );
};
