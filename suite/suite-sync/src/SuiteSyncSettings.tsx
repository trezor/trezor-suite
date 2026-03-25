import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    DEFAULT_SUITE_SYNC_RELAY_URL,
    DEFAULT_SUITE_SYNC_RELAY_URL_DEV,
    DEFAULT_SUITE_SYNC_RELAY_URL_PROD,
    selectIsSuiteSyncDebugEnabled,
    selectIsSuiteSyncFeatureAvailable,
    selectSuiteSyncRelayUrl,
    updateSuiteSyncDebugEnabled,
} from '@suite-common/suite-sync';
import { type SuiteSync } from '@suite-common/suite-sync-types';
import { Button, ButtonGroup, Checkbox, Code, Column, Input, Text } from '@trezor/components';
import { ActionColumn, SectionItem, SettingsSection, TextColumn } from '@trezor/product-components';
import { type BreakpointFlags } from '@trezor/theme';
import { spacings } from '@trezor/theme';

import { WipeSuiteSyncLabels, type WipeSuiteSyncLabelsOnError } from './WipeSuiteSyncLabels';

const selectIsBelowLaptop = (state: { window: BreakpointFlags }) => state.window.isBelowLaptop;

const LOCAL_SUITE_SYNC_RELAY_URL = 'http://127.0.0.1:4000/evolu/';

type SuiteSyncSettingsProps = {
    onError: WipeSuiteSyncLabelsOnError;
    suiteSync: SuiteSync;
};

export const SuiteSyncSettings = ({ onError, suiteSync }: SuiteSyncSettingsProps) => {
    const [isRelayUrlLoading, setIsRelayUrlLoading] = useState(false);

    const dispatch = useDispatch();
    const isBelowLaptop = useSelector(selectIsBelowLaptop);

    const isSuiteSyncFeatureEnabled = useSelector(selectIsSuiteSyncFeatureAvailable);
    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);
    const suiteSyncRelayUrl = useSelector(selectSuiteSyncRelayUrl);

    const [relayUrl, setRelayUrl] = useState(suiteSyncRelayUrl ?? '');

    const handleToggleSuiteSyncDebug = () => {
        dispatch(updateSuiteSyncDebugEnabled({ isEnabled: !isSuiteSyncDebugEnabled }));
    };

    const onRelayUrlSave = async (url = relayUrl) => {
        setIsRelayUrlLoading(true);

        setRelayUrl(url);

        await suiteSync.changeRelayUrl({ relayUrl: url });

        // Fake it, to make some UI interaction for the user
        setTimeout(() => {
            setIsRelayUrlLoading(false);
        }, 300);
    };

    const onRelayUrlPresetClick = (url: string) => {
        setRelayUrl(url);
        void onRelayUrlSave(url);
    };

    if (!isSuiteSyncFeatureEnabled) return null;

    return (
        <SettingsSection title="Suite Sync" isBelowLaptop={isBelowLaptop}>
            <SectionItem>
                <TextColumn title="Relay URL" />
                <ActionColumn>
                    <Column gap={spacings.xxs}>
                        <Input
                            data-testid="@settings/debug/suite-sync/relay-url-input"
                            isDisabled={isRelayUrlLoading}
                            value={relayUrl}
                            onChange={e => setRelayUrl(e.target.value)}
                            rightContent={
                                <Button
                                    data-testid="@settings/debug/suite-sync/save-button"
                                    isLoading={isRelayUrlLoading}
                                    onClick={() => onRelayUrlSave()}
                                    size="small"
                                >
                                    Save
                                </Button>
                            }
                        />
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            Default is: <Code>{DEFAULT_SUITE_SYNC_RELAY_URL}</Code>
                        </Text>
                        <ButtonGroup size="small" priority="secondary">
                            <Button
                                intent="critical"
                                isDisabled={isRelayUrlLoading}
                                onClick={() =>
                                    onRelayUrlPresetClick(DEFAULT_SUITE_SYNC_RELAY_URL_PROD)
                                }
                            >
                                Production
                            </Button>
                            <Button
                                intent="brand"
                                isDisabled={isRelayUrlLoading}
                                onClick={() =>
                                    onRelayUrlPresetClick(DEFAULT_SUITE_SYNC_RELAY_URL_DEV)
                                }
                            >
                                Dev
                            </Button>
                            <Button
                                intent="info"
                                isDisabled={isRelayUrlLoading}
                                onClick={() => onRelayUrlPresetClick(LOCAL_SUITE_SYNC_RELAY_URL)}
                            >
                                Local
                            </Button>
                        </ButtonGroup>
                    </Column>
                </ActionColumn>
            </SectionItem>
            <WipeSuiteSyncLabels onError={onError} suiteSync={suiteSync} />
            <SectionItem>
                <TextColumn title="Suite Sync (Evolu) Debug" />
                <ActionColumn>
                    <Checkbox
                        isChecked={isSuiteSyncDebugEnabled}
                        onChange={handleToggleSuiteSyncDebug}
                    />
                </ActionColumn>
            </SectionItem>
        </SettingsSection>
    );
};
