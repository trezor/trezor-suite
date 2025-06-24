import { useState } from 'react';

import {
    DEFAULT_LOCAL_FIRST_STORAGE_RELAY_URL,
    disposeAllLocalFirstStorageThunk,
} from '@suite-common/local-first-storage';
import { Button, Checkbox, Code, Column, Input, Text } from '@trezor/components';
import { initLocalFirstStorageThunk } from '@trezor/suite-local-first-storage';
import { spacings } from '@trezor/theme';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

import { setLocalFirstStorageRelayAction } from '../../../actions/settings/settingsActions';
import { setFlag } from '../../../actions/suite/suiteActions';
import { SettingsSection } from '../../../components/settings';
import { useDispatch, useSelector } from '../../../hooks/suite';
import {
    selectLocalFirstStorageRelayUrl,
    selectSuiteFlags,
} from '../../../reducers/suite/suiteReducer';

export const LocalFirstStorageDebug = () => {
    const [isLoading, setIsLoading] = useState(false);

    const { isLocalFirstStorageEnabled, isLocalFirstStorageDebugEnabled } =
        useSelector(selectSuiteFlags);
    const localFirstStorageRelayUrl = useSelector(selectLocalFirstStorageRelayUrl);

    const [relayUrl, setRelayUrl] = useState(localFirstStorageRelayUrl ?? '');

    const dispatch = useDispatch();

    const handleToggleLocalFirstStorage = () => {
        dispatch(setFlag('isLocalFirstStorageEnabled', !isLocalFirstStorageEnabled));
        if (!isLocalFirstStorageEnabled) {
            dispatch(initLocalFirstStorageThunk());
        } else {
            dispatch(disposeAllLocalFirstStorageThunk());
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
        dispatch(initLocalFirstStorageThunk());

        // Fake it, to make some UI interaction for the user
        setTimeout(() => {
            setIsLoading(false);
        }, 300);
    };

    return (
        <SettingsSection title="Local First Storage">
            <SectionItem>
                <TextColumn title="Local First Storage (Evolu)" />
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
