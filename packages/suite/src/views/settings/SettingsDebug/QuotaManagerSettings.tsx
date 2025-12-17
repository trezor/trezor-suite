import { useState } from 'react';

import {
    eraseFetchedDataDebug,
    quotaManagerEnabledUpdated,
    selectAssignedOwnerIds,
    selectIsQuotaManagerEnabled,
    selectQuotaManagerBaseUrl,
    selectRegisteredDevices,
    updateQuotaManagerBaseUrl,
} from '@suite-common/suite-sync-quota-manager';
import { Button, Checkbox, Column, Input } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SettingsSection } from 'src/components/settings/SettingsSection';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const QuotaManagerSettings = () => {
    const dispatch = useDispatch();
    const quotaManagerBaseUrl = useSelector(selectQuotaManagerBaseUrl);
    const registeredDevices = useSelector(selectRegisteredDevices);
    const assignedOwnerIds = useSelector(selectAssignedOwnerIds);
    const isQuotaManagerEnabled = useSelector(selectIsQuotaManagerEnabled);
    const [quotaManagerUrl, setQuotaManagerUrl] = useState(quotaManagerBaseUrl ?? '');

    const [isUpdateUrlLoading, setIsUpdateUrlLoading] = useState(false);

    const onQuotaManagerBaseUrlSave = () => {
        setIsUpdateUrlLoading(true);
        dispatch(
            updateQuotaManagerBaseUrl({
                baseUrl: quotaManagerUrl,
            }),
        );

        // fake ui loading delay
        setTimeout(() => {
            setIsUpdateUrlLoading(false);
        }, 300);
    };

    const onEraseFetchedData = () => dispatch(eraseFetchedDataDebug());

    const toggleIsQuotaManagerEnabled = () => {
        dispatch(quotaManagerEnabledUpdated({ isEnabled: !isQuotaManagerEnabled }));
    };

    return (
        <SettingsSection title="Quota Manager">
            <SectionItem>
                <TextColumn
                    title="Enable Quota Manager API"
                    description="This enables the Quota Manager API for Suite Sync."
                />
                <ActionColumn>
                    <Checkbox
                        isChecked={isQuotaManagerEnabled}
                        onClick={toggleIsQuotaManagerEnabled}
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn title="Quota Manager URL" />
                <ActionColumn>
                    <Column gap={spacings.xxs}>
                        <Input
                            disabled={isUpdateUrlLoading}
                            value={quotaManagerUrl}
                            onChange={e => setQuotaManagerUrl(e.target.value)}
                            rightContent={
                                <Button
                                    onClick={onQuotaManagerBaseUrlSave}
                                    size="small"
                                    isLoading={isUpdateUrlLoading}
                                >
                                    Save
                                </Button>
                            }
                        />
                    </Column>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn title="Registered Devices" />
                <ActionColumn>
                    <Column gap={spacings.xxs}>
                        {registeredDevices.length === 0 ? (
                            <div>No devices registered.</div>
                        ) : (
                            registeredDevices.map(device => (
                                <div key={device.publicKey} style={{ marginBottom: 8 }}>
                                    <strong>Device ID:</strong> {device.deviceId}
                                    <br />
                                    <strong>Public Key:</strong> {device.publicKey}
                                    <br />
                                    <strong>Total Storage Size:</strong> {device.totalStorageSize}
                                    <br />
                                    <strong>Unspent Storage Size:</strong>{' '}
                                    {device.unspentStorageSize}
                                </div>
                            ))
                        )}
                    </Column>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn title="Assigned Owner IDs" />
                <ActionColumn>
                    <Column gap={spacings.xxs}>
                        {assignedOwnerIds.length === 0 ? (
                            <div>No owner IDs assigned.</div>
                        ) : (
                            assignedOwnerIds.map(owner => (
                                <div key={owner.ownerId} style={{ marginBottom: 8 }}>
                                    <strong>Owner ID:</strong> {owner.ownerId}
                                    <br />
                                    <strong>Total Space:</strong> {owner.totalSpace}
                                </div>
                            ))
                        )}
                    </Column>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <Button onClick={onEraseFetchedData} intent="critical">
                    Erase fetched data
                </Button>
            </SectionItem>
        </SettingsSection>
    );
};
