import { type ConnectionStatus } from '@suite-common/wallet-types';

export type BackendStatus = 'connected' | 'disconnected' | 'error';

export const getBackendStatus = ({
    connected,
    error,
}: Pick<ConnectionStatus, 'connected' | 'error'>): BackendStatus => {
    if (error) {
        return 'error';
    }

    if (connected) {
        return 'connected';
    }

    return 'disconnected';
};
