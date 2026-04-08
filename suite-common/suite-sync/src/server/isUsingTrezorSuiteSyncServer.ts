import { SUITE_SYNC_SERVERS } from './serverUrl';

export const isUsingTrezorSuiteSyncServer = (relayUrl: string) => {
    const normalizedUrl = relayUrl.trim().toLowerCase();

    return SUITE_SYNC_SERVERS.some(server => normalizedUrl === server.trim().toLowerCase());
};
