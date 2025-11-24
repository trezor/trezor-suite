import { useDispatch, useSelector } from 'react-redux';

import {
    DEFAULT_SUITE_SYNC_RELAY_URL,
    changeRelayUrlThunk,
    disposeAllLocalFirstStorageThunk,
    selectIsFeatureLocalFirstStorageAvailable,
    selectLocalFirstStorageRelayUrl,
    suiteSyncActions,
} from '@suite-common/suite-sync';
import { yup } from '@suite-common/validators';
import { Button, Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { initNativeLocalFirstStorageThunk } from '@suite-native/suite-sync';
import { useToast } from '@suite-native/toasts';

const DEFAULT_CUSTOM_RELAY_URL = '';

export const SuiteSyncRelaySettings = () => {
    const localFirstStorageRelayUrl = useSelector(selectLocalFirstStorageRelayUrl);
    const isFeatureLocalFirstStorageEnabled = useSelector(
        selectIsFeatureLocalFirstStorageAvailable,
    );
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
        dispatch(changeRelayUrlThunk({ relayUrl: values.localFirstStorageRelayUrl }));
        showToast({
            message: 'Local First Storage relay URL updated',
            variant: 'success',
        });
    });

    const handleLocalFirstEnableToggle = () => {
        const originalIsLocalFirstStorageEnabled = isFeatureLocalFirstStorageEnabled;
        // This is probably irrelevant for native
        dispatch(
            suiteSyncActions.updateIsFeatureLocalFirstStorageAvailable({
                isShownInSettings: !isFeatureLocalFirstStorageEnabled,
            }),
        );
        // Here, we need this as well,as we don't have experimental feature in Native
        dispatch(
            suiteSyncActions.updateLocalFirstStorageEnabled({
                isEnabled: !isFeatureLocalFirstStorageEnabled,
            }),
        );

        if (!originalIsLocalFirstStorageEnabled) {
            dispatch(initNativeLocalFirstStorageThunk());
        } else {
            dispatch(disposeAllLocalFirstStorageThunk());
        }
    };

    const handleResetToDefault = () => {
        dispatch(changeRelayUrlThunk({ relayUrl: DEFAULT_SUITE_SYNC_RELAY_URL }));
        form.reset({ localFirstStorageRelayUrl: DEFAULT_SUITE_SYNC_RELAY_URL });
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
                        isChecked={isFeatureLocalFirstStorageEnabled}
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
