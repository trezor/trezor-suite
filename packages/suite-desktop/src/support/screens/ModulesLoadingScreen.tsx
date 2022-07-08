import React, { useState, useEffect } from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { LoadingScreen } from '@suite-support/screens/LoadingScreen';

export const ModulesLoadingScreen = () => {
    const [message, _setMessage] = useState<string>();

    useEffect(() => {
        if (!desktopApi.available) return;

        desktopApi.on('handshake/event', _e => {
            // TODO do we want to show the progress messages?
            // _setMessage(_e.message);
        });
        return () => {
            desktopApi.removeAllListeners('handshake/event');
        };
    }, []);

    return <LoadingScreen message={message} />;
};
