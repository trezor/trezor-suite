import { useDispatch, useSelector } from 'react-redux';

import {
    DEFAULT_SUITE_SYNC_RELAY_URL,
    selectIsFeatureSuiteSyncAvailable,
    selectSuiteSyncRelayUrl,
    suiteSyncActions,
} from '@suite-common/suite-sync';
import { yup } from '@suite-common/validators';
import { Button, Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { useNativeServices } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';

const DEFAULT_CUSTOM_RELAY_URL = '';

export const SuiteSyncRelaySettings = () => {
    const suiteSyncRelayUrl = useSelector(selectSuiteSyncRelayUrl);
    const isFeatureSuiteSyncEnabled = useSelector(selectIsFeatureSuiteSyncAvailable);
    const { suiteSync } = useNativeServices();
    const { showToast } = useToast();
    const dispatch = useDispatch();

    const form = useForm<{ suiteSyncRelayUrl: string }>({
        defaultValues: {
            suiteSyncRelayUrl: suiteSyncRelayUrl ?? DEFAULT_CUSTOM_RELAY_URL,
        },
        validation: yup.object({
            suiteSyncRelayUrl: yup.string(),
        }),
    });

    const onSubmit = form.handleSubmit(async values => {
        await suiteSync.changeRelayUrl({ relayUrl: values.suiteSyncRelayUrl });
        showToast({
            message: 'Suite Sync relay URL updated',
            variant: 'success',
        });
    });

    const handleSuiteSyncEnableToggle = () => {
        dispatch(
            suiteSyncActions.updateIsFeatureSuiteSyncAvailable({
                isShownInSettings: !isFeatureSuiteSyncEnabled,
            }),
        );
    };

    const handleResetToDefault = async () => {
        await suiteSync.changeRelayUrl({ relayUrl: DEFAULT_SUITE_SYNC_RELAY_URL });
        form.reset({ suiteSyncRelayUrl: DEFAULT_SUITE_SYNC_RELAY_URL });
        showToast({
            message: 'Suite Sync relay URL reset to default',
            variant: 'success',
        });
    };

    return (
        <Card>
            <VStack paddingTop="sp16">
                <HStack justifyContent="space-between">
                    <Text testID="@suiteSync/header" variant="highlight">
                        Enable Suite Sync in settings (Evolu)
                    </Text>
                    <CheckBox
                        testID="@suiteSync/enable-toggle"
                        isChecked={isFeatureSuiteSyncEnabled}
                        onChange={handleSuiteSyncEnableToggle}
                    />
                </HStack>
                <VStack spacing="sp8">
                    <Text>Custom relay URL</Text>
                    <Form form={form}>
                        <TextInputField
                            testID="@suiteSync/custom-relay-url-input"
                            name="suiteSyncRelayUrl"
                            placeholder="Enter custom relay URL"
                        />
                        <Button
                            testID="@suiteSync/custom-relay-url-save-button"
                            colorScheme="tertiaryElevation0"
                            size="small"
                            onPress={onSubmit}
                        >
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
                            {DEFAULT_SUITE_SYNC_RELAY_URL}
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
