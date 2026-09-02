import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { selectIsTorEnabled } from '@suite/tor';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@trezor/product-components';
import { type TorSettings, desktopApi } from '@trezor/suite-desktop-api';

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
    const isTorEnabled = useSelector(selectIsTorEnabled);

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
        const matchedOption = options.find(o => o.value === externalPort);
        setSelectedOption(matchedOption);
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
        <Anchor anchorId={SettingsAnchor.TorExternal}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_EXPERIMENTAL_TOR_EXTERNAL_PORT" />}
                        description={
                            <Translation id="TR_EXPERIMENTAL_TOR_EXTERNAL_PORT_DESCRIPTION" />
                        }
                    />
                    <ActionColumn>
                        <ActionSelect
                            value={selectedOption}
                            options={options}
                            onChange={onChange}
                            isDisabled={isTorEnabled}
                        />
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
