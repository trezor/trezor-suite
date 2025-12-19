import { useDispatch, useSelector } from 'react-redux';

import {
    eraseFetchedDataDebug,
    quotaManagerEnabledUpdated,
    selectIsQuotaManagerEnabled,
    selectOwnersAllowance,
    selectQuotaManagerBaseUrl,
    selectRegisteredDevices,
    updateQuotaManagerBaseUrl,
} from '@suite-common/suite-sync-quota-manager';
import { yup } from '@suite-common/validators';
import { Button, Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { useToast } from '@suite-native/toasts';

export const SuiteSyncQuotaManager = () => {
    const dispatch = useDispatch();
    const { showToast } = useToast();

    const isQuotaManagerEnabled = useSelector(selectIsQuotaManagerEnabled);
    const quotaManagerBaseUrl = useSelector(selectQuotaManagerBaseUrl);
    const registeredDevices = useSelector(selectRegisteredDevices);
    const ownersAllowance = useSelector(selectOwnersAllowance);

    const handleQuotaManagerEnableToggle = () =>
        dispatch(quotaManagerEnabledUpdated({ isEnabled: !isQuotaManagerEnabled }));

    const onEraseFetchedData = () => dispatch(eraseFetchedDataDebug());

    const form = useForm<{ suiteSyncQuotaManagerUrl: string }>({
        defaultValues: {
            suiteSyncQuotaManagerUrl: quotaManagerBaseUrl ?? '',
        },
        validation: yup.object({
            suiteSyncQuotaManagerUrl: yup.string().url('Invalid URL format'),
        }),
    });

    const onSubmit = form.handleSubmit(values => {
        dispatch(updateQuotaManagerBaseUrl({ baseUrl: values.suiteSyncQuotaManagerUrl }));
        showToast({
            message: 'Quota Manager URL updated',
            variant: 'success',
        });
    });

    return (
        <Card>
            <VStack paddingTop="sp16">
                <HStack justifyContent="space-between">
                    <Text>Quota Manager</Text>
                    <CheckBox
                        isChecked={isQuotaManagerEnabled}
                        onChange={handleQuotaManagerEnableToggle}
                    />
                </HStack>

                <VStack marginTop="sp8">
                    <Text variant="hint" color="textSubdued">
                        Quota Manager URL
                    </Text>
                    <Form form={form}>
                        <TextInputField
                            name="suiteSyncQuotaManagerUrl"
                            placeholder="Enter custom Quota Manager URL"
                        />
                        <Button colorScheme="tertiaryElevation0" size="small" onPress={onSubmit}>
                            Save
                        </Button>
                    </Form>
                </VStack>

                <VStack marginTop="sp16" spacing="sp8">
                    <Text variant="hint" color="textSubdued">
                        Registered Devices
                    </Text>
                    {registeredDevices.length === 0 ? (
                        <Text>No devices registered.</Text>
                    ) : (
                        registeredDevices.map(device => (
                            <VStack key={device.publicKey} spacing="sp2">
                                <Text variant="label">Device ID</Text>
                                <Text>{device.deviceId}</Text>
                                <Text variant="label">Public Key</Text>
                                <Text>{device.publicKey}</Text>
                                <Text variant="label">Total Storage Size</Text>
                                <Text>{device.totalStorageSize}</Text>
                                <Text variant="label">Unspent Storage Size</Text>
                                <Text>{device.unspentStorageSize}</Text>
                            </VStack>
                        ))
                    )}
                </VStack>

                <VStack marginTop="sp16" spacing="sp8">
                    <Text variant="hint" color="textSubdued">
                        Assigned Owner IDs
                    </Text>
                    {ownersAllowance.length === 0 ? (
                        <Text>No owner IDs assigned.</Text>
                    ) : (
                        ownersAllowance.map(owner => (
                            <VStack key={owner.walletDescriptor} spacing="sp2">
                                <Text variant="label">Owner ID</Text>
                                <Text>{owner.walletDescriptor}</Text>
                                <Text variant="label">Total Space</Text>
                                <Text>{owner.totalSpace}</Text>
                            </VStack>
                        ))
                    )}
                </VStack>

                <HStack marginTop="sp8">
                    <Button colorScheme="redBold" onPress={onEraseFetchedData}>
                        Erase fetched data
                    </Button>
                </HStack>
            </VStack>
        </Card>
    );
};
