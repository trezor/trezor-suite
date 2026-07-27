import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import {
    type WithSuiteSyncState,
    getSuiteSyncDefaultRelayUrl,
    selectIsSuiteSyncDebugEnabled,
    selectSuiteSyncRelayUrl,
    updateSuiteSyncDebugEnabled,
} from '@suite-common/suite-sync';
import { selectChangeRelayUrlDep } from '@suite-common/suite-sync-types';
import { yup } from '@suite-common/validators';
import { Button, Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { useToast } from '@suite-native/toasts';

const DEFAULT_CUSTOM_RELAY_URL = '';

export const SuiteSyncRelaySettings = () => {
    const suiteSyncRelayUrl = useSelector((state: WithSuiteSyncState) =>
        selectSuiteSyncRelayUrl(state, false),
    );
    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);
    const defaultSuiteSyncRelayUrl = getSuiteSyncDefaultRelayUrl({ isTorEnabled: false });

    const { changeRelayUrl } = useServices(selectChangeRelayUrlDep);

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
        await changeRelayUrl({ relayUrl: values.suiteSyncRelayUrl });
        showToast({
            message: 'Suite Sync relay URL updated',
            intent: 'brand',
        });
    });

    const handleSuiteSyncDebugToggle = () => {
        dispatch(
            updateSuiteSyncDebugEnabled({
                isEnabled: !isSuiteSyncDebugEnabled,
            }),
        );
    };

    const handleResetToDefault = async () => {
        await changeRelayUrl({ relayUrl: defaultSuiteSyncRelayUrl });
        form.reset({ suiteSyncRelayUrl: defaultSuiteSyncRelayUrl });
        showToast({
            message: 'Suite Sync relay URL reset to default',
            intent: 'brand',
        });
    };

    return (
        <Card>
            <VStack spacing="sp12">
                <Text variant="headline-sm" testID="@suiteSync/header">
                    Suite Sync Relay Settings
                </Text>
                <VStack>
                    <HStack justifyContent="space-between">
                        <Text>Enable Suite Sync Debug</Text>
                        <CheckBox
                            isChecked={isSuiteSyncDebugEnabled}
                            onChange={handleSuiteSyncDebugToggle}
                        />
                    </HStack>
                </VStack>
                <Form form={form}>
                    <VStack>
                        <TextInputField
                            testID="@suiteSync/custom-relay-url-input"
                            name="suiteSyncRelayUrl"
                            label="Custom relay URL"
                        />
                        <Button
                            testID="@suiteSync/custom-relay-url-save-button"
                            intent="neutral"
                            priority="secondary"
                            size="medium"
                            onPress={onSubmit}
                        >
                            Save
                        </Button>
                        <Button
                            intent="neutral"
                            priority="secondary"
                            size="medium"
                            onPress={handleResetToDefault}
                        >
                            Reset to default
                        </Button>
                        <Text>
                            Default:{' '}
                            <Text
                                variant="body-xs"
                                color="contentSecondary"
                                style={{ fontFamily: 'monospace' }}
                            >
                                {defaultSuiteSyncRelayUrl}
                            </Text>
                        </Text>
                    </VStack>
                </Form>
            </VStack>
        </Card>
    );
};
