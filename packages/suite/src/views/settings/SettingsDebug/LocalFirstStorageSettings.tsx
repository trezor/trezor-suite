import { useState } from 'react';

import {
    DEFAULT_SUITE_SYNC_RELAY_URL,
    changeRelayUrlThunk,
    selectLocalFirstStorageRelayUrl,
    suiteSyncActions,
} from '@suite-common/suite-sync';
import { Button, Checkbox, Code, Column, Input, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SettingsSection } from 'src/components/settings/SettingsSection';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';

export const LocalFirstStorageSettings = () => {
    const [isLoading, setIsLoading] = useState(false);

    const {
        isLocalFirstStorageDebugEnabled,
        isFeatureLocalFirstStorageAvailable,
        toggleIsFeatureLocalFirstStorageAvailable,
    } = useLabelingCombined({
        // In debug, there may not be any device selected and it is in fact irrelevant
        deviceStaticSessionId: undefined,
    });

    const localFirstStorageRelayUrl = useSelector(selectLocalFirstStorageRelayUrl);

    const [relayUrl, setRelayUrl] = useState(localFirstStorageRelayUrl ?? '');

    const dispatch = useDispatch();

    const handleToggleLocalFirstStorageDebug = () => {
        dispatch(
            suiteSyncActions.updateLocalFirstStorageDebugEnabled({
                isEnabled: !isLocalFirstStorageDebugEnabled,
            }),
        );
    };

    const onRelayUrlSave = () => {
        setIsLoading(true);
        dispatch(changeRelayUrlThunk({ relayUrl }));

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
                        isChecked={isFeatureLocalFirstStorageAvailable}
                        onClick={toggleIsFeatureLocalFirstStorageAvailable}
                    />
                </ActionColumn>
            </SectionItem>
            {!isFeatureLocalFirstStorageAvailable && (
                <p>
                    Enable Local First Storage is disabled. To use Local First Storage (Evolu),
                    enable Suite Sync experimental feature in the Experimental settings section.
                </p>
            )}
            {isFeatureLocalFirstStorageAvailable && (
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
                                isChecked={isLocalFirstStorageDebugEnabled}
                                onClick={handleToggleLocalFirstStorageDebug}
                            />
                        </ActionColumn>
                    </SectionItem>
                </>
            )}
        </SettingsSection>
    );
};
