import { useDispatch, useSelector } from 'react-redux';

import {
    DEFAULT_SUITE_SYNC_RELAY_URL,
    changeRelayUrlThunk,
    disposeAllSuiteSyncStoragesThunk,
    selectIsFeatureSuiteSyncAvailable,
    selectSuiteSyncRelayUrl,
    suiteSyncActions,
} from '@suite-common/suite-sync';
import { yup } from '@suite-common/validators';
import { Button, Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { initSuiteSyncNative } from '@suite-native/suite-sync';
import { useToast } from '@suite-native/toasts';

const DEFAULT_CUSTOM_RELAY_URL = '';

export const SuiteSyncRelaySettings = () => {
    const suiteSyncRelayUrl = useSelector(selectSuiteSyncRelayUrl);
    const isFeatureSuiteSyncEnabled = useSelector(selectIsFeatureSuiteSyncAvailable);
    const dispatch = useDispatch();
    const { showToast } = useToast();

    const form = useForm<{ suiteSyncRelayUrl: string }>({
        defaultValues: {
            suiteSyncRelayUrl: suiteSyncRelayUrl ?? DEFAULT_CUSTOM_RELAY_URL,
        },
        validation: yup.object({
            suiteSyncRelayUrl: yup.string(),
        }),
    });

    const onSubmit = form.handleSubmit(values => {
        dispatch(changeRelayUrlThunk({ relayUrl: values.suiteSyncRelayUrl }));
        showToast({
            message: 'Local First Storage relay URL updated',
            variant: 'success',
        });
    });

    const handleSuiteSyncEnableToggle = () => {
        const originalIsSuiteSyncEnabled = isFeatureSuiteSyncEnabled;
        // This is probably irrelevant for native
        dispatch(
            suiteSyncActions.updateIsFeatureSuiteSyncAvailable({
                isShownInSettings: !isFeatureSuiteSyncEnabled,
            }),
        );
        // Here, we need this as well,as we don't have experimental feature in Native
        dispatch(
            suiteSyncActions.updateSuiteSyncEnabled({
                isEnabled: !isFeatureSuiteSyncEnabled,
            }),
        );

        if (!originalIsSuiteSyncEnabled) {
            dispatch((_, getState) => initSuiteSyncNative({ getState }));
        } else {
            dispatch(disposeAllSuiteSyncStoragesThunk());
        }
    };

    const handleResetToDefault = () => {
        dispatch(changeRelayUrlThunk({ relayUrl: DEFAULT_SUITE_SYNC_RELAY_URL }));
        form.reset({ suiteSyncRelayUrl: DEFAULT_SUITE_SYNC_RELAY_URL });
        showToast({
            message: 'Local First Storage relay URL reset to default',
            variant: 'success',
        });
    };

    return (
        <Card>
            <VStack paddingTop="sp16">
                <HStack justifyContent="space-between">
                    <Text variant="highlight">Enable Suite Sync in settings (Evolu)</Text>
                    <CheckBox
                        isChecked={isFeatureSuiteSyncEnabled}
                        onChange={handleSuiteSyncEnableToggle}
                    />
                </HStack>
                <VStack spacing="sp8">
                    <Text>Custom relay URL</Text>
                    <Form form={form}>
                        <TextInputField
                            name="suiteSyncRelayUrl"
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
