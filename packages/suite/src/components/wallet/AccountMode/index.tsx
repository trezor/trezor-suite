import React from 'react';
import styled from 'styled-components';
import { SelectedAccountWatchOnlyMode } from '@suite-common/wallet-types';

import AuthConfirmFailed from './AuthConfirmFailed';
import BackendDisconnected from './BackendDisconnected';
import DeviceUnavailable from './DeviceUnavailable';

const Container = styled.div`
    margin-bottom: 10px;
`;

interface AccountModeProps {
    mode: SelectedAccountWatchOnlyMode[] | undefined;
}

export const AccountMode = (props: AccountModeProps) => {
    if (!props.mode) {
        return null;
    }

    return (
        <Container>
            {props.mode.map(m => {
                switch (m) {
                    case 'auth-confirm-failed':
                        return <AuthConfirmFailed key={m} />;
                    case 'backend-disconnected':
                        return <BackendDisconnected key={m} />;
                    case 'device-unavailable':
                        return <DeviceUnavailable key={m} />;
                    default:
                        return null;
                }
            })}
        </Container>
    );
};
