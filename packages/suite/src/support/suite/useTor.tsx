import { useMemo } from 'react';

import { useDesktopTorStatus } from '@suite/tor-desktop';
import { useWebTorStatus } from '@suite/tor-web';
import { useServices } from '@suite-common/dependency-injection';
import {
    selectDisconnectAllRelaysDep,
    selectReconnectAllRelaysDep,
} from '@suite-common/suite-sync-types';

import { useTorReconnectionLifecycle } from './useTorReconnectionLifecycle';

export const useTor = () => {
    const { reconnectAllRelays, disconnectAllRelays } = useServices(
        selectReconnectAllRelaysDep,
        selectDisconnectAllRelaysDep,
    );

    // IMPORTANT: This is the place to register all services
    //            that need to disconnect/reconnect when
    //            Tor is changing the state.
    const torReconnectionLifecycleParams = useMemo(
        () => ({
            reconnect: reconnectAllRelays,
            disconnect: disconnectAllRelays,
        }),
        [disconnectAllRelays, reconnectAllRelays],
    );

    const handleTorReconnection = useTorReconnectionLifecycle(torReconnectionLifecycleParams);

    // Each platform derives Tor status differently: web from the onion domain,
    // desktop from the local Tor daemon events. Both feed the shared reconnection lifecycle.
    useWebTorStatus({ onStatusChange: handleTorReconnection });
    useDesktopTorStatus({ onStatusChange: handleTorReconnection });
};
