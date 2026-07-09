import { useState } from 'react';

import { selectIsTorEnabled } from '@suite/tor';
import {
    enforceQuotaManagerUpdated,
    eraseFetchedData,
    getQuotaManagerDefaultUrl,
    getQuotaManagerUrl,
    selectEnforceQuotaManager,
    selectOwnersAllowance,
    selectQuotaManagerCustomUrl,
    selectRegisteredDevices,
    updateQuotaManagerBaseUrl,
} from '@suite-common/suite-sync-quota-manager';
import { Button, ButtonGroup, Checkbox, Code, Column, Input, Text } from '@trezor/components';
import { ActionColumn, SectionItem, SettingsSection, TextColumn } from '@trezor/product-components';
import { breakpoints, spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

export const QuotaManagerSettings = () => {
    const dispatch = useDispatch();
    const hasContentBelowTabletWidth = useIsContentBelowBreakpoint(breakpoints.laptop);
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const quotaManagerCustomUrl = useSelector(selectQuotaManagerCustomUrl);
    const registeredDevices = useSelector(selectRegisteredDevices);
    const ownersAllowance = useSelector(selectOwnersAllowance);
    const enforceQuotaManager = useSelector(selectEnforceQuotaManager);
    const defaultQuotaManagerUrl = getQuotaManagerDefaultUrl({ isTorEnabled });
    const [quotaManagerUrl, setQuotaManagerUrl] = useState(quotaManagerCustomUrl ?? '');

    const [isUpdateUrlLoading, setIsUpdateUrlLoading] = useState(false);

    const onQuotaManagerBaseUrlSave = (baseUrl = quotaManagerUrl) => {
        setIsUpdateUrlLoading(true);

        setQuotaManagerUrl(baseUrl);
        dispatch(updateQuotaManagerBaseUrl({ baseUrl }));

        // fake ui loading delay
        setTimeout(() => {
            setIsUpdateUrlLoading(false);
        }, 300);
    };

    const onEraseFetchedData = () => dispatch(eraseFetchedData());

    const onQuotaManagerUrlPresetClick = (baseUrl: string) => {
        setQuotaManagerUrl(baseUrl);
        onQuotaManagerBaseUrlSave(baseUrl);
    };

    const onToggleEnforceQuotaManager = () =>
        dispatch(
            enforceQuotaManagerUpdated({
                enforce: !enforceQuotaManager,
            }),
        );

    return (
        <SettingsSection hasVerticalLayout={hasContentBelowTabletWidth} title="Quota Manager">
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
                                    onClick={() => onQuotaManagerBaseUrlSave()}
                                    size="small"
                                    isLoading={isUpdateUrlLoading}
                                >
                                    Save
                                </Button>
                            }
                        />
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            Default is: <Code>{defaultQuotaManagerUrl}</Code>
                        </Text>
                        <ButtonGroup size="small" priority="secondary">
                            <Button
                                intent="critical"
                                isDisabled={isUpdateUrlLoading}
                                onClick={() =>
                                    onQuotaManagerUrlPresetClick(
                                        getQuotaManagerUrl({ env: 'prod', isTorEnabled }),
                                    )
                                }
                            >
                                Production
                            </Button>
                            <Button
                                intent="brand"
                                isDisabled={isUpdateUrlLoading}
                                onClick={() =>
                                    onQuotaManagerUrlPresetClick(
                                        getQuotaManagerUrl({ env: 'dev', isTorEnabled }),
                                    )
                                }
                            >
                                Dev
                            </Button>
                            <Button
                                intent="info"
                                isDisabled={isUpdateUrlLoading}
                                onClick={() =>
                                    onQuotaManagerUrlPresetClick(
                                        getQuotaManagerUrl({ env: 'local', isTorEnabled }),
                                    )
                                }
                            >
                                Local
                            </Button>
                            <Button
                                intent="neutral"
                                isDisabled={isUpdateUrlLoading}
                                onClick={() => onQuotaManagerUrlPresetClick('')}
                            >
                                Reset
                            </Button>
                        </ButtonGroup>
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
                                    <strong>Total Storage Size:</strong>{' '}
                                    <>
                                        <Code>{device.totalStorageSize}</Code>&nbsp;B
                                    </>
                                    <br />
                                    <strong>Unspent Storage Size:</strong>{' '}
                                    <>
                                        <Code>{device.unspentStorageSize}</Code>&nbsp;B
                                    </>
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
                                    <strong>Total Space:</strong>{' '}
                                    <>
                                        <Code>{owner.totalSpace}</Code>&nbsp;B
                                    </>
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
