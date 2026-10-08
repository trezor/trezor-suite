import { useCallback, useEffect, useState } from 'react';

import styled from 'styled-components';

import { injectDesktopApi } from '@suite/desktop-app-api';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { Switch } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const ShowOnTray = () => {
    const { desktopApi } = useServices(injectDesktopApi);
    const [showOnTrayEnabled, setShowOnTrayEnabled] = useState(false);

    const updateStatus = useCallback(() => {
        desktopApi.getTraySettings().then(result => {
            if (result.success) {
                setShowOnTrayEnabled(result.payload.showOnTray);
            }
        });
    }, [desktopApi]);
    // set initial state based on real electron settings
    useEffect(() => {
        updateStatus();

        desktopApi.on('tray/settings', result => {
            setShowOnTrayEnabled(result.showOnTray);
        });

        return () => {
            desktopApi.removeAllListeners('tray/settings');
        };
    }, [desktopApi, updateStatus]);

    const handleChange = (enabled: boolean) => {
        desktopApi.changeTraySettings({ showOnTray: enabled });
        Promise.resolve().then(() => updateStatus());
    };

    return (
        <Anchor anchorId={SettingsAnchor.AutoStart}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_SHOW_ON_TRAY" />}
                    description={<Translation id="TR_SHOW_ON_TRAY_DESCRIPTION" />}
                    actions={
                        <PositionedSwitch>
                            <Switch
                                data-testid="@show-on-tray/toggle-switch"
                                isChecked={!!showOnTrayEnabled}
                                onChange={() => handleChange(!showOnTrayEnabled)}
                            />
                        </PositionedSwitch>
                    }
                />
            )}
        </Anchor>
    );
};
