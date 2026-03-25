import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    DEFAULT_SUITE_SYNC_RELAY_URL,
    selectIsSuiteSyncDebugEnabled,
    selectSuiteSyncRelayUrl,
    updateSuiteSyncDebugEnabled,
} from '@suite-common/suite-sync';
import { type SuiteSync } from '@suite-common/suite-sync-types';
import { Button, Checkbox, Code, Column, Input, Text } from '@trezor/components';
import { ActionColumn, SectionItem, SettingsSection, TextColumn } from '@trezor/product-components';
import { type BreakpointFlags } from '@trezor/theme';
import { spacings } from '@trezor/theme';

const selectIsBelowLaptop = (state: { window: BreakpointFlags }) => state.window.isBelowLaptop;

type SuiteSyncSettingsProps = {
    isSuiteSyncFeatureEnabled: boolean;
    suiteSync: SuiteSync;
};

export const SuiteSyncSettings = ({
    isSuiteSyncFeatureEnabled,
    suiteSync,
}: SuiteSyncSettingsProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useDispatch();
    const isBelowLaptop = useSelector(selectIsBelowLaptop);

    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);
    const suiteSyncRelayUrl = useSelector(selectSuiteSyncRelayUrl);

    const [relayUrl, setRelayUrl] = useState(suiteSyncRelayUrl ?? '');

    const handleToggleSuiteSyncDebug = () => {
        dispatch(
            updateSuiteSyncDebugEnabled({
                isEnabled: !isSuiteSyncDebugEnabled,
            }),
        );
    };

    const onRelayUrlSave = async () => {
        setIsLoading(true);

        await suiteSync.changeRelayUrl({ relayUrl });

        // Fake it, to make some UI interaction for the user
        setTimeout(() => {
            setIsLoading(false);
        }, 300);
    };

    if (!isSuiteSyncFeatureEnabled) {
        return (
            <SettingsSection title="Suite Sync" isBelowLaptop={isBelowLaptop}>
                <p>Suite Sync is disabled. Enable it in the Experimental Features settings.</p>
            </SettingsSection>
        );
    }

    return (
        <SettingsSection title="Suite Sync" isBelowLaptop={isBelowLaptop}>
            <SectionItem>
                <TextColumn title="Relay URL" />
                <ActionColumn>
                    <Column gap={spacings.xxs}>
                        <Input
                            data-testid="@settings/debug/suite-sync/relay-url-input"
                            isDisabled={isLoading}
                            value={relayUrl}
                            onChange={e => setRelayUrl(e.target.value)}
                            rightContent={
                                <Button
                                    data-testid="@settings/debug/suite-sync/save-button"
                                    isLoading={isLoading}
                                    onClick={onRelayUrlSave}
                                    size="small"
                                >
                                    Save
                                </Button>
                            }
                        />
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            Default is: <Code>{DEFAULT_SUITE_SYNC_RELAY_URL}</Code>
                        </Text>
                    </Column>
                </ActionColumn>
            </SectionItem>
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
