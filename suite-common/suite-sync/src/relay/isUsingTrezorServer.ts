import { getSuiteSyncTrezorRelayUrls } from './relayUrl';

export const isUsingTrezorServer = (relayUrl: string) => {
    const normalizedUrl = relayUrl.trim().toLowerCase();

    return getSuiteSyncTrezorRelayUrls().some(
        server => normalizedUrl === server.trim().toLowerCase(),
    );
};
