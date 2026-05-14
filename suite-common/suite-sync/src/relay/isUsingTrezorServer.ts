import { SUITE_SYNC_RELAY_SERVERS } from './relayUrl';

export const isUsingTrezorServer = (relayUrl: string) => {
    const normalizedUrl = relayUrl.trim().toLowerCase();

    return SUITE_SYNC_RELAY_SERVERS.some(server => normalizedUrl === server.trim().toLowerCase());
};
