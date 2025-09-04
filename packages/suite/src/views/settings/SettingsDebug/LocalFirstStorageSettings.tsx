import { useState } from 'react';

import {
    DEFAULT_LOCAL_FIRST_STORAGE_RELAY_URL,
    disposeAllLocalFirstStorageThunk,
} from '@suite-common/local-first-storage';
import { Banner, Button, Checkbox, Code, Column, Input, Text } from '@trezor/components';
import { initSuiteLocalFirstStorageThunk } from '@trezor/suite-local-first-storage';
import { spacings } from '@trezor/theme';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

import { setLocalFirstStorageRelayAction } from '../../../actions/settings/settingsActions';
import { setFlag } from '../../../actions/suite/suiteActions';
import { SettingsSection } from '../../../components/settings';
import { useDispatch, useSelector } from '../../../hooks/suite';
import { useLabelingCombined } from '../../../hooks/suite/useLabelingCombined';
import { selectLocalFirstStorageRelayUrl } from '../../../selectors/suite/suiteSelectors';

export const LocalFirstStorageSettings = () => {
    const [isLoading, setIsLoading] = useState(false);

    const {
        legacyMetadataState,
        isLocalFirstStorageEnabled,
        isLocalFirstStorageDebugEnabled,
        localFirstDisable,
        localFirstEnable,
    } = useLabelingCombined();

    const localFirstStorageRelayUrl = useSelector(selectLocalFirstStorageRelayUrl);

    const [relayUrl, setRelayUrl] = useState(localFirstStorageRelayUrl ?? '');

    const dispatch = useDispatch();

    const handleToggleLocalFirstStorage = () => {
        if (!isLocalFirstStorageEnabled) {
            localFirstEnable();
        } else {
            localFirstDisable();
        }
    };

    const handleToggleLocalFirstStorageDebug = () => {
        dispatch(setFlag('isLocalFirstStorageDebugEnabled', !isLocalFirstStorageDebugEnabled));
    };

    const onRelayUrlSave = () => {
        setIsLoading(true);
        dispatch(setLocalFirstStorageRelayAction({ url: relayUrl }));

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
                    description={
                        legacyMetadataState.enabled && (
                            <Banner>
                                Legacy Labeling will be turned off by enabling Local First Storage
                                (Evolu)
                            </Banner>
                        )
                    }
                />
                <ActionColumn>
                    <Checkbox
                        isChecked={isLocalFirstStorageEnabled}
                        onClick={handleToggleLocalFirstStorage}
                    />
                </ActionColumn>
            </SectionItem>
            {isLocalFirstStorageEnabled && (
                <>
                    <SectionItem>
                        <TextColumn title="Relay URL" />
                        <ActionColumn>
                            <Column gap={spacings.xxs}>
                                <Input
                                    isDisabled={isLoading}
                                    value={relayUrl}
                                    onChange={e => setRelayUrl(e.target.value)}
                                    innerAddon={
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
