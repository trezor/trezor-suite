import { useState } from 'react';

import { selectHasExperimentalFeature } from '@suite/settings';
import {
    DEFAULT_SUITE_SYNC_RELAY_URL,
    selectIsSuiteSyncDebugEnabled,
    selectSuiteSyncRelayUrl,
    updateSuiteSyncDebugEnabled,
} from '@suite-common/suite-sync';
import { Button, Checkbox, Code, Column, Input, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SettingsSection } from 'src/components/settings/SettingsSection';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

export const SuiteSyncSettings = () => {
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useDispatch();
    const { suiteSync } = useSuiteServices();

    const isSuiteSyncFeatureEnabled = useSelector(selectHasExperimentalFeature('suite-sync'));
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
            <SettingsSection title="Suite Sync">
                <p>Suite Sync is disabled. Enable it in the Experimental Features settings.</p>
            </SettingsSection>
        );
    }

    return (
        <SettingsSection title="Suite Sync">
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
