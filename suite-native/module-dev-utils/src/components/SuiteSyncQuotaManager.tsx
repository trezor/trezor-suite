import { useDispatch, useSelector } from 'react-redux';

import {
    enforceQuotaManagerUpdated,
    eraseFetchedData,
    selectEnforceQuotaManager,
    selectOwnersAllowance,
    selectQuotaManagerBaseUrl,
    selectRegisteredDevices,
    updateQuotaManagerBaseUrl,
} from '@suite-common/suite-sync-quota-manager';
import { yup } from '@suite-common/validators';
import { Box, Button, Card, HStack, Switch, Text, VStack } from '@suite-native/atoms';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { useToast } from '@suite-native/toasts';

export const SuiteSyncQuotaManager = () => {
    const dispatch = useDispatch();
    const { showToast } = useToast();

    const quotaManagerBaseUrl = useSelector(selectQuotaManagerBaseUrl);
    const registeredDevices = useSelector(selectRegisteredDevices);
    const ownersAllowance = useSelector(selectOwnersAllowance);
    const enforceQuotaManager = useSelector(selectEnforceQuotaManager);

    const onEraseFetchedData = () => dispatch(eraseFetchedData());

    const onToggleEnforceQuotaManager = () =>
        dispatch(
            enforceQuotaManagerUpdated({
                enforce: !enforceQuotaManager,
            }),
        );

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
            <VStack spacing="sp12">
                <Text variant="headline-sm">Suite Sync Quota Manager</Text>
                <Form form={form}>
                    <VStack>
                        <TextInputField label="Quota Manager URL" name="suiteSyncQuotaManagerUrl" />
                        <Button colorScheme="tertiaryElevation0" size="small" onPress={onSubmit}>
                            Save
                        </Button>
                    </VStack>
                </Form>
                <VStack>
                    <Text variant="body-sm" color="textSubdued">
                        Registered Devices
                    </Text>
                    {registeredDevices.length === 0 ? (
                        <Text>No devices registered.</Text>
                    ) : (
                        registeredDevices.map(device => (
                            <VStack key={device.deviceId} spacing="sp2">
                                <Text variant="body-xs">Device ID</Text>
                                <Text>{device.deviceId}</Text>
                                <Text variant="body-xs">Total Storage Size</Text>
                                <Text>{device.totalStorageSize}</Text>
                                <Text variant="body-xs">Unspent Storage Size</Text>
                                <Text>{device.unspentStorageSize}</Text>
                            </VStack>
                        ))
                    )}
                </VStack>
                <VStack>
                    <Text variant="body-sm" color="textSubdued">
                        Assigned Owner IDs
                    </Text>
                    {ownersAllowance.length === 0 ? (
                        <Text>No owner IDs assigned.</Text>
                    ) : (
                        ownersAllowance.map(owner => (
                            <VStack key={owner.walletDescriptor} spacing="sp2">
                                <Text variant="body-xs">Owner ID</Text>
                                <Text>{owner.walletDescriptor}</Text>
                                <Text variant="body-xs">Total Space</Text>
                                <Text>{owner.totalSpace}</Text>
                            </VStack>
                        ))
                    )}
                </VStack>
                <HStack justifyContent="space-between">
                    <Box flexShrink={1}>
                        <Text variant="body-sm" color="textSubdued">
                            Enforce Quota Manager for custom relay
                        </Text>
                    </Box>
                    <Switch
                        isChecked={enforceQuotaManager}
                        onChange={onToggleEnforceQuotaManager}
                    />
                </HStack>
                <Button colorScheme="redBold" onPress={onEraseFetchedData}>
                    Erase fetched data
                </Button>
            </VStack>
        </Card>
    );
};
