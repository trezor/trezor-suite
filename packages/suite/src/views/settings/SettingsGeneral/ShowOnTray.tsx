import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Switch } from '@trezor/components';

import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { desktopApi } from '@trezor/suite-desktop-api';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const ShowOnTray = () => {
    const [showOnTrayEnabled, setShowOnTrayEnabled] = useState(false);

    const updateStatus = () => {
        desktopApi.getTraySettings().then(result => {
            if (result.success) {
                setShowOnTrayEnabled(result.payload.showOnTray);
            }
        });
    };
    // set initial state based on real electron settings
    useEffect(() => {
        updateStatus();

        desktopApi.on('tray/settings', result => {
            setShowOnTrayEnabled(result.showOnTray);
        });

        return () => {
            desktopApi.removeAllListeners('tray/settings');
        };
    }, []);

    const handleChange = (enabled: boolean) => {
        desktopApi.changeTraySettings({ showOnTray: enabled });
        Promise.resolve().then(() => updateStatus());
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.AutoStart}>
            <TextColumn
                title={<Translation id="TR_SHOW_ON_TRAY" />}
                description={<Translation id="TR_SHOW_ON_TRAY_DESCRIPTION" />}
            />
            <ActionColumn>
                <PositionedSwitch>
                    <Switch
                        data-testid="@show-on-tray/toggle-switch"
                        isChecked={!!showOnTrayEnabled}
                        onChange={() => handleChange(!showOnTrayEnabled)}
                    />
                </PositionedSwitch>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
