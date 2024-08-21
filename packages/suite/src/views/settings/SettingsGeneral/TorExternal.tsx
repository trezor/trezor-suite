import { ChangeEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';

import { TorSettings } from '@trezor/suite-desktop-api/src/messages';
import { breakpointMediaQueries } from '@trezor/styles';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Button, Input } from '@trezor/components';
import { isFullPath } from '@trezor/utils';
import { spacingsPx } from '@trezor/theme';

import { ActionColumn, SectionItem, TextColumn, Translation } from 'src/components/suite';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { useSelector, useTranslation } from 'src/hooks/suite';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${spacingsPx.sm};
    min-width: 200px;

    ${breakpointMediaQueries.below_sm} {
        min-width: 100%;
    }
`;

export const TorExternal = () => {
    const { isTorEnabled } = useSelector(selectTorState);

    const [error, setError] = useState<string | null>(null);
    const [hasPathChanged, setHasPathChanged] = useState(false);

    const [torSettings, setTorSettings] = useState<TorSettings | null>(null);

    const { translationString } = useTranslation();

    useEffect(() => {
        const fetchTorSettings = async () => {
            const result = await desktopApi.getTorSettings();
            console.log('result from getTorSettings', result);
            if (result.success) {
                setTorSettings(result.payload);
            } else {
                setError(result.error);
            }
        };

        fetchTorSettings();

        const handleTorSettingsChange = (settings: TorSettings) => setTorSettings(settings);
        desktopApi.on('tor/settings', handleTorSettingsChange);

        return () => {
            desktopApi.removeAllListeners('tor/settings');
        };
    }, []);

    const handleChange: ChangeEventHandler<HTMLInputElement> = ({ target: { value } }) => {
        console.log('handleChange');
        console.log('value', value);
        console.log('torSettings', torSettings);
        if (!torSettings) return;

        setHasPathChanged(true);
        if (!isFullPath(value) && value !== '') {
            // TODO: change text and code to translate.
            setError(translationString('TR_TOR_CONFIG_SNOWFLAKE_ERROR_PATH'));
        } else {
            setError(null);
        }
        setTorSettings({ ...torSettings, torDataDir: value });
    };

    const handleClick = () => {
        if (!torSettings) return;

        if (!error) {
            // update torDataDir
            desktopApi.changeTorSettings({
                ...torSettings,
                torDataDir: torSettings.torDataDir,
            });
            setHasPathChanged(false);
        }
    };

    const isUpdateDisabled =
        !torSettings ||
        !!error ||
        (!isFullPath(torSettings.torDataDir) && torSettings.torDataDir !== '') ||
        isTorEnabled ||
        !hasPathChanged;

    if (!torSettings) return null;

    return (
        <>
            <SectionItem data-test="@settings/general/tor/external-enable">
                {/* TODO: translate text! */}
                <TextColumn
                    title="Tor external data directory"
                    description="Use external Tor daemon instead of the one bundled with Trezor Suite. In order to use it, Trezor Suite requires the data directory used by the external Tor daemon."
                />
                <ActionColumn>
                    <Container>
                        <Input
                            isDisabled={isTorEnabled}
                            bottomText={error || null}
                            value={torSettings.torDataDir}
                            placeholder=""
                            inputState={error ? 'error' : undefined}
                            onChange={handleChange}
                            data-test="@settings/general/tor/data-directory-path"
                            hasBottomPadding={false}
                            size="small"
                        />
                        <Button
                            onClick={handleClick}
                            isDisabled={isUpdateDisabled}
                            data-test="@settings/general/tor/data-directory-path-submit"
                            size="small"
                            isFullWidth
                        >
                            {/* TODO: change text translated */}
                            <Translation id="TR_TOR_CONFIG_SNOWFLAKE_UPDATE_LABEL" />
                        </Button>
                    </Container>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
