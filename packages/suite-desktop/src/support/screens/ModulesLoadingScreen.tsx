import React, { useState } from 'react';
import { desktopApi, BootstrapTorEvent } from '@trezor/suite-desktop-api';
import { LoadingScreen } from '@suite-support/screens/LoadingScreen';

export const ModulesLoadingScreen = () => {
    enum TorBootstrapStatus {
        Enabled,
        Enabeling,
        Error,
    }
    const [torBootstrapStatus, setTorBootstrapStatus] = useState<TorBootstrapStatus>(
        TorBootstrapStatus.Enabeling,
    );

    desktopApi.on('tor/bootstrap', (bootstrapEvent: BootstrapTorEvent) => {
        if (bootstrapEvent.type === 'error') {
            setTorBootstrapStatus(TorBootstrapStatus.Error);
        }

        if (bootstrapEvent.type !== 'progress') return;
        if (bootstrapEvent.progress.current === bootstrapEvent.progress.total) {
            desktopApi.removeAllListeners('tor/bootstrap');
            setTorBootstrapStatus(TorBootstrapStatus.Enabled);
        } else {
            setTorBootstrapStatus(TorBootstrapStatus.Enabeling);
        }
    });

    let message = '';

    if (torBootstrapStatus === TorBootstrapStatus.Enabeling) {
        message = 'Enabling TOR';
    } else if (torBootstrapStatus === TorBootstrapStatus.Error) {
        message = 'Enabling TOR Failed';
    }

    return <LoadingScreen message={message} />;
};
