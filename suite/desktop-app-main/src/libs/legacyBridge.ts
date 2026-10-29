const LEGACY_BRIDGE_URL = 'http://127.0.0.1:21325/';
const LEGACY_BRIDGE_PROBE_TIMEOUT_MS = 5_000;

const isLegacyBridgeInfo = (data: unknown) =>
    typeof data === 'object' &&
    data !== null &&
    'version' in data &&
    typeof data.version === 'string' &&
    data.version.startsWith('2.');

/**
 * Detects whether legacy standalone trezord-go (port 21325) is running on the system.
 *
 * The probe must run in the main process: trezord-go answers 403 to every origin outside its
 * allowlist (`*.trezor.io`, `localhost:[58]xxx`, ...), and the packaged renderer loads from `file://`.
 *
 * Only a `2.x` version is flagged. All legacy trezord-go builds report `2.x`, the modern
 * node-bridge reports `3.x`.
 */
export const isLegacyBridgeRunning = async (): Promise<boolean> => {
    try {
        const response = await fetch(LEGACY_BRIDGE_URL, {
            method: 'POST',
            headers: { Origin: 'https://electron.trezor.io' },
            signal: AbortSignal.timeout(LEGACY_BRIDGE_PROBE_TIMEOUT_MS),
        });
        if (!response.ok) return false;

        return isLegacyBridgeInfo(await response.json());
    } catch {
        return false;
    }
};
