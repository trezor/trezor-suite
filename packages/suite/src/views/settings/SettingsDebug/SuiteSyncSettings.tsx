import { useState } from 'react';

import { useServices } from '@suite-common/redux-utils';
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

export const SuiteSyncSettings = () => {
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useDispatch();
    const { suiteSync } = useServices();

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
        <SettingsSection title="Local First Storage">
            <SectionItem>
                <TextColumn
                    title="Local First Storage (Evolu)"
                    description="This enables Local First Storage (Evolu) for labeling in the application settings. This is an experimental feature."
                />
                <ActionColumn>
                    <Checkbox
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
                                    isDisabled={isLoading}
                                    value={relayUrl}
                                    onChange={e => setRelayUrl(e.target.value)}
                                    rightContent={
                                        <Button
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
                        <TextColumn title="Local First Storage (Evolu) Debug" />
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
