import { useEffect, useState } from 'react';

import { Switch } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

export const TrezorConnectWS = () => {
    const [websocketEnabled, setWebsocketEnabled] = useState(false);
    const updateWebsocketStatus = () => {
        desktopApi.connectPopupEnabled().then(result => {
            setWebsocketEnabled(result);
        });
    };
    useEffect(() => {
        updateWebsocketStatus();
    }, []);
    const toggleWebsocket = () => {
        desktopApi.connectPopupSetEnabled(!websocketEnabled).then(() => {
            updateWebsocketStatus();
        });
    };

    return (
        <SectionItem>
            <TextColumn
                title="TrezorConnect WebSocket server"
                description="Enables new Connect-in-Suite workflow"
            />
            <ActionColumn>
                <Switch isChecked={websocketEnabled} onChange={toggleWebsocket} />
            </ActionColumn>
        </SectionItem>
    );
};
