import { ChangeEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { TorSettings } from '@trezor/suite-desktop-api/src/messages';
import { TOR_SNOWFLAKE_PROJECT_URL } from '@trezor/urls';
import { breakpointMediaQueries } from '@trezor/styles';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Button, Input } from '@trezor/components';
import { isFullPath } from '@trezor/utils';
import { spacingsPx } from '@trezor/theme';

import { ActionColumn, SectionItem, TextColumn, Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';

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

export const TorSnowflake = () => {
    const { isTorEnabled } = useSelector(selectTorState);
    const [torSettings, setTorSettings] = useState<TorSettings | null>(null);
    const [hasPathChanged, setHasPathChanged] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { translationString } = useTranslation();

    useEffect(() => {
        const fetchTorSettings = async () => {
            const result = await desktopApi.getTorSettings();
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
        if (!torSettings) return;

        setHasPathChanged(true);
        if (!isFullPath(value) && value !== '') {
            setError(translationString('TR_TOR_CONFIG_SNOWFLAKE_ERROR_PATH'));
        } else {
            setError(null);
        }
        setTorSettings(prevSettings => ({
            ...prevSettings!,
            snowflakeBinaryPath: value,
        }));
    };

    const handleClick = async () => {
        if (!torSettings || error) return;

        await desktopApi.changeTorSettings({
            ...torSettings,
            snowflakeBinaryPath: torSettings.snowflakeBinaryPath,
        });
        setHasPathChanged(false);
    };

    const isUpdateDisabled =
        !torSettings ||
        !!error ||
        (!isFullPath(torSettings.snowflakeBinaryPath) && torSettings.snowflakeBinaryPath !== '') ||
        isTorEnabled ||
        !hasPathChanged;

    if (!torSettings) return null;

    const buttonTranslationId =
        torSettings.snowflakeBinaryPath === '' && hasPathChanged
            ? 'TR_TOR_CONFIG_SNOWFLAKE_DISABLE_LABEL'
            : 'TR_TOR_CONFIG_SNOWFLAKE_UPDATE_LABEL';

    return (
        <SectionItem data-test="@settings/general/tor/snowflake-enable">
            <TextColumn
                title={<Translation id="TR_TOR_CONFIG_SNOWFLAKE_TITLE" />}
                description={<Translation id="TR_TOR_CONFIG_SNOWFLAKE_DESCRIPTION" />}
                buttonLink={TOR_SNOWFLAKE_PROJECT_URL}
            />
            <ActionColumn>
                <Container>
                    <Input
                        isDisabled={isTorEnabled}
                        bottomText={error || null}
                        value={torSettings.snowflakeBinaryPath}
                        placeholder=""
                        inputState={error ? 'error' : undefined}
                        onChange={handleChange}
                        data-test="@settings/general/tor/snowflake-binary-path"
                        hasBottomPadding={false}
                        size="small"
                    />
                    <Button
                        onClick={handleClick}
                        isDisabled={isUpdateDisabled}
                        data-test="@settings/device/label-submit"
                        size="small"
                        isFullWidth
                    >
                        <Translation id={buttonTranslationId} />
                    </Button>
                </Container>
            </ActionColumn>
        </SectionItem>
    );
};
