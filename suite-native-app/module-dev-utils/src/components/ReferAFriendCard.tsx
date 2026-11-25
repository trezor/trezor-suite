import { useSelector } from 'react-redux';

import { referAFriendActions, selectReferAFriendApiCustomUrl } from '@suite-common/refer-a-friend';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm, yup } from '@suite-native/forms';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type FormValues = {
    apiCustomUrl?: string;
};

export const ReferAFriendCard = () => {
    const { dispatch } = useServices(injectDispatch);

    const apiCustomUrl = useSelector(selectReferAFriendApiCustomUrl);

    const form = useForm<FormValues>({
        validation: yup.object({
            apiCustomUrl: yup.string().url(),
        }),
        defaultValues: {
            apiCustomUrl: apiCustomUrl ?? '',
        },
        mode: 'onSubmit',
    });
    const { isDirty } = form.formState;

    const submit = form.handleSubmit(formValues => {
        dispatch(
            referAFriendActions.setReferAFriendApiBaseUrl({
                baseUrl: formValues.apiCustomUrl ?? null,
            }),
        );
        form.reset(formValues);
    });

    return (
        <Card>
            <VStack spacing="sp12">
                <Text variant="headline-sm">Refer-A-Friend</Text>
                <Form form={form}>
                    <TextInputField
                        name="apiCustomUrl"
                        label="API custom URL"
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                </Form>
                {isDirty && (
                    <Button size="medium" onPress={() => submit()}>
                        Save
                    </Button>
                )}
            </VStack>
        </Card>
    );
};
