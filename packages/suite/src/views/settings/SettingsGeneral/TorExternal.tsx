import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { ActionColumn, ActionSelect, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { type TorSettings } from '@trezor/suite-desktop-api/src/messages';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';

const options = [
    {
        value: 9050,
        label: 'Tor external (9050)',
    },
    {
        value: 9150,
        label: 'Tor browser (9150)',
    },
];

export const TorExternal = () => {
    const { isTorEnabled } = useSelector(selectTorState);

    const [torSettings, setTorSettings] = useState<TorSettings | null>(null);

    const [selectedOption, setSelectedOption] = useState<
        { value: number; label: string } | undefined
    >(options[0]);

    useEffect(() => {
        const fetchTorSettings = async () => {
            const result = await desktopApi.getTorSettings();
            if (result.success) {
                setTorSettings(result.payload);
            }
        };

        fetchTorSettings();

        const handleTorSettingsChange = (settings: TorSettings) => setTorSettings(settings);
        desktopApi.on('tor/settings', handleTorSettingsChange);

        return () => {
            desktopApi.removeAllListeners('tor/settings');
        };
    }, []);

    useEffect(() => {
        if (!torSettings) return;
        const { externalPort } = torSettings;
        const selectedOption = options.find(o => o.value === externalPort);
        setSelectedOption(selectedOption!);
    }, [torSettings]);

    const onChange = async ({ value }: { value: number }) => {
        if (!torSettings) return;
        await desktopApi.changeTorSettings({
            ...torSettings,
            externalPort: value,
        });
    };

    if (!torSettings) return null;

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.TorExternal}>
            <TextColumn
                title={<Translation id="TR_EXPERIMENTAL_TOR_EXTERNAL_PORT" />}
                description={<Translation id="TR_EXPERIMENTAL_TOR_EXTERNAL_PORT_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionSelect
                    value={selectedOption}
                    options={options}
                    onChange={onChange}
                    isDisabled={isTorEnabled}
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
