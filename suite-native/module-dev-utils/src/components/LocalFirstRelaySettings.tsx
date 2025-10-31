import { useDispatch, useSelector } from 'react-redux';

import {
    DEFAULT_LOCAL_FIRST_STORAGE_RELAY_URL,
    disposeAllLocalFirstStorageThunk,
    labelingActions,
    selectIsLocalFirstStorageEnabled,
    selectLocalFirstStorageRelayUrl,
} from '@suite-common/local-first-storage';
import { yup } from '@suite-common/validators';
import { Button, Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { initNativeLocalFirstStorageThunk } from '@suite-native/local-first-storage';
import { useToast } from '@suite-native/toasts';

const DEFAULT_CUSTOM_RELAY_URL = '';

export const LocalFirstRelaySettings = () => {
    const localFirstStorageRelayUrl = useSelector(selectLocalFirstStorageRelayUrl);
    const isLocalFirstStorageEnabled = useSelector(selectIsLocalFirstStorageEnabled);
    const dispatch = useDispatch();
    const { showToast } = useToast();

    const form = useForm<{ localFirstStorageRelayUrl: string }>({
        defaultValues: {
            localFirstStorageRelayUrl: localFirstStorageRelayUrl ?? DEFAULT_CUSTOM_RELAY_URL,
        },
        validation: yup.object({
            localFirstStorageRelayUrl: yup.string(),
        }),
    });

    const onSubmit = form.handleSubmit(values => {
        dispatch(
            labelingActions.setLocalFirstStorageRelayUrl({ url: values.localFirstStorageRelayUrl }),
        );
        showToast({
            message: 'Local First Storage relay URL updated',
            variant: 'success',
        });
    });

    const handleLocalFirstEnableToggle = () => {
        const originalIsLocalFirstStorageEnabled = isLocalFirstStorageEnabled;
        dispatch(
            labelingActions.updateLocaleFirstStorageEnabled({
                isEnabled: !isLocalFirstStorageEnabled,
            }),
        );

        if (!originalIsLocalFirstStorageEnabled) {
            dispatch(initNativeLocalFirstStorageThunk());
        } else {
            dispatch(disposeAllLocalFirstStorageThunk());
        }
    };

    const handleResetToDefault = () => {
        dispatch(
            labelingActions.setLocalFirstStorageRelayUrl({
                url: DEFAULT_CUSTOM_RELAY_URL,
            }),
        );
        form.reset({
            localFirstStorageRelayUrl: DEFAULT_CUSTOM_RELAY_URL,
        });
        showToast({
            message: 'Local First Storage relay URL reset to default',
            variant: 'success',
        });
    };

    return (
        <Card>
            <VStack paddingTop="sp16">
                <HStack justifyContent="space-between">
                    <Text variant="highlight">Enable Local First Storage (Evolu)</Text>
                    <CheckBox
                        isChecked={isLocalFirstStorageEnabled}
                        onChange={handleLocalFirstEnableToggle}
                    />
                </HStack>
                <VStack spacing="sp8">
                    <Text>Custom relay URL</Text>
                    <Form form={form}>
                        <TextInputField
                            name="localFirstStorageRelayUrl"
                            placeholder="Enter custom relay URL"
                        />
                        <Button colorScheme="tertiaryElevation0" size="small" onPress={onSubmit}>
                            Save
                        </Button>
                    </Form>
                    <Text>
                        Default:{' '}
                        <Text
                            variant="label"
                            color="textSubdued"
                            style={{ fontFamily: 'monospace' }}
                        >
                            {DEFAULT_LOCAL_FIRST_STORAGE_RELAY_URL}
                        </Text>
                    </Text>
                    <Button
                        colorScheme="tertiaryElevation0"
                        size="small"
                        onPress={handleResetToDefault}
                    >
                        Reset to default
                    </Button>
                </VStack>
            </VStack>
        </Card>
    );
};
