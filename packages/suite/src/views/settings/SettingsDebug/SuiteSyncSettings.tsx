import { useState } from 'react';

import {
    DEFAULT_SUITE_SYNC_RELAY_URL,
    selectSuiteSyncRelayUrl,
    suiteSyncActions,
} from '@suite-common/suite-sync';
import { Button, Checkbox, Code, Column, Input, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SettingsSection } from 'src/components/settings/SettingsSection';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';

import { useSuiteServices } from '../../../support/SuiteServicesProvider';

export const SuiteSyncSettings = () => {
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useDispatch();
    const { suiteSync } = useSuiteServices();

    const {
        isSuiteSyncDebugEnabled,
        isFeatureSuiteSyncAvailable,
        toggleIsFeatureSuiteSyncAvailable,
    } = useLabelingCombined({
        // In debug, there may not be any device selected and it is in fact irrelevant
        deviceStaticSessionId: undefined,
    });

    const suiteSyncRelayUrl = useSelector(selectSuiteSyncRelayUrl);

    const [relayUrl, setRelayUrl] = useState(suiteSyncRelayUrl ?? '');

    const handleToggleSuiteSyncDebug = () => {
        dispatch(
            suiteSyncActions.updateSuiteSyncDebugEnabled({
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

    return (
        <SettingsSection title="Suite Sync">
            <SectionItem>
                <TextColumn
                    title="Suite Sync (Evolu)"
                    description="This enables Suite Sync (Evolu) for labeling in the application settings. This is an experimental feature."
                />
                <ActionColumn>
                    <Checkbox
                        data-testid="@settings/debug/suite-sync/checkbox"
                        isChecked={isFeatureSuiteSyncAvailable}
                        onClick={toggleIsFeatureSuiteSyncAvailable}
                    />
                </ActionColumn>
            </SectionItem>
            {!isFeatureSuiteSyncAvailable && (
                <p>Suite Sync is disabled. Enable it in the Experimental Features settings.</p>
            )}
            {isFeatureSuiteSyncAvailable && (
                <>
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
                                <Text typographyStyle="hint" variant="tertiary">
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
                                onClick={handleToggleSuiteSyncDebug}
                            />
                        </ActionColumn>
                    </SectionItem>
                </>
            )}
        </SettingsSection>
    );
};
