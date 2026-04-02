import { useState } from 'react';

import {
    DEFAULT_QUOTA_MANAGER_URL,
    enforceQuotaManagerUpdated,
    eraseFetchedData,
    selectEnforceQuotaManager,
    selectOwnersAllowance,
    selectQuotaManagerBaseUrl,
    selectRegisteredDevices,
    updateQuotaManagerBaseUrl,
} from '@suite-common/suite-sync-quota-manager';
import { Button, Checkbox, Code, Column, Input, Text } from '@trezor/components';
import { ActionColumn, SectionItem, SettingsSection, TextColumn } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';

export const QuotaManagerSettings = () => {
    const dispatch = useDispatch();
    const { isBelowLaptop } = useLayoutSize();
    const quotaManagerBaseUrl = useSelector(selectQuotaManagerBaseUrl);
    const registeredDevices = useSelector(selectRegisteredDevices);
    const ownersAllowance = useSelector(selectOwnersAllowance);
    const enforceQuotaManager = useSelector(selectEnforceQuotaManager);
    const [quotaManagerUrl, setQuotaManagerUrl] = useState(quotaManagerBaseUrl ?? '');

    const [isUpdateUrlLoading, setIsUpdateUrlLoading] = useState(false);

    const onQuotaManagerBaseUrlSave = () => {
        setIsUpdateUrlLoading(true);

        const normalizedUrl =
            quotaManagerUrl.trim() === '' ? DEFAULT_QUOTA_MANAGER_URL : quotaManagerUrl;

        setQuotaManagerUrl(normalizedUrl);
        dispatch(
            updateQuotaManagerBaseUrl({
                baseUrl: normalizedUrl,
            }),
        );

        // fake ui loading delay
        setTimeout(() => {
            setIsUpdateUrlLoading(false);
        }, 300);
    };

    const onEraseFetchedData = () => dispatch(eraseFetchedData());

    const onToggleEnforceQuotaManager = () =>
        dispatch(
            enforceQuotaManagerUpdated({
                enforce: !enforceQuotaManager,
            }),
        );

    return (
        <SettingsSection isBelowLaptop={isBelowLaptop} title="Quota Manager">
            <SectionItem>
                <TextColumn title="Quota Manager URL" />
                <ActionColumn>
                    <Column gap={spacings.xxs}>
                        <Input
                            data-testid="@settings/debug/quota-manager-url-input"
                            disabled={isUpdateUrlLoading}
                            value={quotaManagerUrl}
                            onChange={e => setQuotaManagerUrl(e.target.value)}
                            rightContent={
                                <Button
                                    data-testid="@settings/debug/quota-manager-url-save-button"
                                    onClick={onQuotaManagerBaseUrlSave}
                                    size="small"
                                    isLoading={isUpdateUrlLoading}
                                >
                                    Save
                                </Button>
                            }
                        />
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            Default is: <Code>{DEFAULT_QUOTA_MANAGER_URL}</Code>
                        </Text>
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
                                <div key={device.deviceId} style={{ marginBottom: 8 }}>
                                    <strong>Device ID:</strong> {device.deviceId}
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
                        {ownersAllowance.length === 0 ? (
                            <div>No owner IDs assigned.</div>
                        ) : (
                            ownersAllowance.map(owner => (
                                <div key={owner.walletDescriptor} style={{ marginBottom: 8 }}>
                                    <strong>walletDescriptor:</strong> {owner.walletDescriptor}
                                    <br />
                                    <strong>Total Space:</strong> {owner.totalSpace}
                                </div>
                            ))
                        )}
                    </Column>
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn title="Enforce Quota Manager for custom relay" />
                <ActionColumn>
                    <Checkbox
                        data-testid="@settings/debug/quota-manager-enforce-for-custom-relay-checkbox"
                        isChecked={enforceQuotaManager}
                        onChange={onToggleEnforceQuotaManager}
                    />
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
