import { networks } from '@suite-common/wallet-config';

/**
 * Map a `PermissionRequest.coin` (which is `coinInfo.shortcut`, e.g. `BTC`,
 * `ETH`, `LTC`) to a human-readable network name. Falls back to the upper-case
 * shortcut when the coin is not known to suite (e.g. an altcoin recognised
 * only by `@trezor/connect`).
 */
export const getCoinLabel = (shortcut: string): string => {
    const key = shortcut.toLowerCase() as keyof typeof networks;
    const network = networks[key];

    return network?.name ?? shortcut.toUpperCase();
};
