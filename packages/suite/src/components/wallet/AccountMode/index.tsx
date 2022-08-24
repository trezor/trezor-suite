import React from 'react';
import { SelectedAccountWatchOnlyMode } from '@suite-common/wallet-types';

import AuthConfirmFailed from './AuthConfirmFailed';
import BackendDisconnected from './BackendDisconnected';
import DeviceUnavailable from './DeviceUnavailable';

interface Props {
    mode: SelectedAccountWatchOnlyMode[] | undefined;
}

const AccountMode = (props: Props) => {
    if (!props.mode) return null;
    return (
        <>
            {props.mode.map(m => {
                switch (m) {
                    case 'auth-confirm-failed':
                        return <AuthConfirmFailed key={m} />;
                    case 'backend-disconnected':
                        return <BackendDisconnected key={m} />;
                    case 'device-unavailable':
                        return <DeviceUnavailable key={m} />;
                    default:
                        // return <>{m} not implemented</>;
                        return null;
                }
            })}
        </>
    );
};

export default AccountMode;
