import { useState } from 'react';

import {
    DEFAULT_LOCAL_FIRST_STORAGE_RELAY_URL,
    disposeAllLocalFirstStorageThunk,
    labelingActions,
    selectLocalFirstStorageRelayUrl,
} from '@suite-common/local-first-storage';
import { Checkbox, Code, Column, Input, NewButton, Text } from '@trezor/components';
import { initSuiteLocalFirstStorageThunk } from '@trezor/suite-local-first-storage';
import { spacings } from '@trezor/theme';

import { SettingsSection } from 'src/components/settings/SettingsSection';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';

export const LocalFirstStorageSettings = () => {
    const [isLoading, setIsLoading] = useState(false);

    const {
        isLocalFirstStorageDebugEnabled,
        toggleIsFeatureLocalFirstStorageAvailable,
        isFeatureLocalFirstStorageAvailable,
    } = useLabelingCombined({
        // In debug, there may not be any device selected and it is in fact irrelevant
        deviceStaticSessionId: undefined,
    });

    const localFirstStorageRelayUrl = useSelector(selectLocalFirstStorageRelayUrl);

    const [relayUrl, setRelayUrl] = useState(localFirstStorageRelayUrl ?? '');

    const dispatch = useDispatch();

    const handleToggleLocalFirstStorageDebug = () => {
        dispatch(
            labelingActions.updateLocalFirstStorageDebugEnabled({
                isEnabled: !isLocalFirstStorageDebugEnabled,
            }),
        );
    };

    const onRelayUrlSave = () => {
        setIsLoading(true);
        dispatch(labelingActions.setLocalFirstStorageRelayUrl({ url: relayUrl }));

        // We need to dispose of all Evolu instances and create new
        // as they do not support the Relay URL change
        dispatch(disposeAllLocalFirstStorageThunk());
        dispatch(initSuiteLocalFirstStorageThunk());

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
                                        <NewButton
                                            isLoading={isLoading}
                                            onClick={onRelayUrlSave}
                                            size="small"
                                        >
                                            Save
                                        </NewButton>
                                    }
                                />
                                <Text typographyStyle="hint" variant="tertiary">
                                    Default is: <Code>{DEFAULT_LOCAL_FIRST_STORAGE_RELAY_URL}</Code>
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
