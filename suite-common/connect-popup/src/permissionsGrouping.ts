import { networks } from '@suite-common/wallet-config';
import { type PermissionRequest } from '@trezor/connect';
import { unique } from '@trezor/utils/src/unique';

// There are permissions that depend on a coin, e.g. `read_address` for Bitcoin.
// There are also permissions that are not scoped to a coin, e.g. `management`.
export type GroupedPermissions = {
    coin?: string;
    permissions: PermissionRequest['permission'][];
};

// When a coin group is collapsed, at most this many permission icons are
// previewed next to its heading (shared by the web and native UIs).
export const PERMISSION_PREVIEW_LIMIT = 6;

/**
 * Map a `PermissionRequest.coin` (which is `coinInfo.shortcut`, e.g. `BTC`,
 * `ETH`, `LTC`) to a human-readable network name. Falls back to the upper-case
 * shortcut when the coin is not known to suite (e.g. an altcoin recognised
 * only by `@trezor/connect`).
 */
export const getCoinLabel = (shortcut: string): string => {
    const key = shortcut.toLowerCase() as keyof typeof networks;

    return networks[key]?.name ?? shortcut.toUpperCase();
};

// Icon shown for each permission. These names exist in both the web icon set and
// the mobile icon font, so the web and native permission UIs render identical
// glyphs. Typed as plain strings here (the shared package has no icon-library
// dependency); each platform validates the value against its own `IconName` at
// the call site.
export const permissionIcons = {
    read_address: 'eye',
    read_xpub: 'key',
    read_account_info: 'wallet',
    read_settings: 'slidersHorizontal',
    read_features: 'cpu',
    sign: 'signature',
    sign_message: 'notePencil',
    verify_message: 'sealCheck',
    management: 'gearSix',
    push_tx: 'broadcast',
    internal: 'cube',
} as const satisfies Record<PermissionRequest['permission'], string>;

export const permissionsAreCovered = (
    requested: PermissionRequest[],
    granted: PermissionRequest[],
): boolean =>
    requested.every(req =>
        granted.some(g => g.permission === req.permission && g.coin === req.coin),
    );

export const groupPermissionsByCoin = (permissions: PermissionRequest[]): GroupedPermissions[] => {
    const order: (string | undefined)[] = [];
    const byCoin = new Map<string | undefined, PermissionRequest['permission'][]>();

    for (const { coin, permission } of permissions) {
        if (!byCoin.has(coin)) {
            byCoin.set(coin, []);
            order.push(coin);
        }
        byCoin.get(coin)!.push(permission);
    }

    const coinFirst = order.filter(c => c !== undefined);
    const groups: GroupedPermissions[] = coinFirst.map(coin => ({
        coin,
        permissions: unique(byCoin.get(coin)!),
    }));
    if (byCoin.has(undefined)) {
        groups.push({ permissions: unique(byCoin.get(undefined)!) });
    }

    return groups;
};
