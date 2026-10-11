export type LocalNetworkAccessState = 'granted' | 'denied' | 'prompt' | 'unknown';

const isKnownState = (state: string): state is Exclude<LocalNetworkAccessState, 'unknown'> =>
    state === 'granted' || state === 'denied' || state === 'prompt';

/**
 * Asks the browser whether this page may reach the bridge on the local network. Chromium
 * browsers gate requests from a public website to `127.0.0.1` behind this permission. Browsers
 * that do not know it reject the query, which is reported as `unknown` and treated as "just try".
 */
export const queryLocalNetworkAccess = async (): Promise<LocalNetworkAccessState> => {
    try {
        const status = await navigator.permissions.query({
            // The permission is newer than the DOM type definitions.
            name: 'local-network-access' as PermissionName,
        });

        return isKnownState(status.state) ? status.state : 'unknown';
    } catch {
        return 'unknown';
    }
};
