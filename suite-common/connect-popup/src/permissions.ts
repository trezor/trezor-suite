import { networks } from '@suite-common/wallet-config';
import { type EnabledNetwork, type PermissionRequest, isCoinSymbol } from '@trezor/connect';
import { unique } from '@trezor/utils/src/unique';

// Coin symbols (`coinInfo.shortcut`) are unique regardless of casing, but a granted permission
// keeps the shortcut's original casing (e.g. `BTC`, `tDASH`) while a declared/host-supplied one may
// use any casing. Compare and de-duplicate coins case-insensitively so coverage and grouping match
// across the two.
const coinKey = (coin?: string) => coin?.toLowerCase();
const sameCoin = (a?: string, b?: string) => coinKey(a) === coinKey(b);

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
        granted.some(g => g.permission === req.permission && sameCoin(g.coin, req.coin)),
    );

export const groupPermissionsByCoin = (permissions: PermissionRequest[]): GroupedPermissions[] => {
    const order: (string | undefined)[] = [];
    // Keyed by the case-insensitive coin key; keeps the first-seen coin as the group's display coin.
    const byCoin = new Map<
        string | undefined,
        { coin?: string; permissions: PermissionRequest['permission'][] }
    >();

    for (const { coin, permission } of permissions) {
        const key = coinKey(coin);
        if (!byCoin.has(key)) {
            byCoin.set(key, { coin, permissions: [] });
            order.push(key);
        }
        byCoin.get(key)!.permissions.push(permission);
    }

    const coinFirst = order.filter(c => c !== undefined);
    const groups: GroupedPermissions[] = coinFirst.map(key => {
        const group = byCoin.get(key)!;

        return { coin: group.coin, permissions: unique(group.permissions) };
    });
    if (byCoin.has(undefined)) {
        groups.push({ permissions: unique(byCoin.get(undefined)!.permissions) });
    }

    return groups;
};

// Permissions a 3rd-party app may be granted up front. `management` and `internal` are never
// grantable to a dapp, and `push_tx` is additionally excluded on deeplink sources — mirrors the
// hard block in connectPopupCallThunkInner. Everything else (including unknown/garbage values from
// untrusted host input, and coins that are not a known `CoinSymbol`) is dropped.
const GRANTABLE_PERMISSIONS: ReadonlySet<PermissionRequest['permission']> = new Set([
    'read_address',
    'read_xpub',
    'read_account_info',
    'read_settings',
    'read_features',
    'sign',
    'sign_message',
    'verify_message',
    'push_tx',
]);

export const sanitizeRequestedPermissions = (
    requested: PermissionRequest[] | undefined,
    isDeeplink: boolean,
): PermissionRequest[] =>
    (requested ?? []).filter(
        permission =>
            GRANTABLE_PERMISSIONS.has(permission.permission) &&
            !(permission.permission === 'push_tx' && isDeeplink) &&
            (permission.coin === undefined || isCoinSymbol(permission.coin.toLowerCase())),
    );

// Union two permission lists, de-duplicated by (permission, coin) with coin compared
// case-insensitively. `base` comes first, so on a collision its entry (and coin casing) wins.
export const mergePermissions = (
    base: PermissionRequest[],
    extra: PermissionRequest[],
): PermissionRequest[] => {
    const seen = new Set<string>();
    const out: PermissionRequest[] = [];
    for (const permission of [...base, ...extra]) {
        const key = `${permission.permission}:${coinKey(permission.coin) ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(permission);
    }

    return out;
};

// Today `enabledNetworks` only gates Cardano `derive_cardano`, so project ONLY Cardano grants;
// grants for other coins stay pure authorization for now.
// TODO(#23879): generalize once enabledNetworks drives more than Cardano derivation.
const CARDANO_COINS = new Set(['ada', 'tada']);

/** Projects granted per-coin permissions into the Cardano networks to enable in `@trezor/connect`. */
export const deriveCardanoEnabledNetworks = (
    permissions: PermissionRequest[],
): EnabledNetwork[] => {
    const seen = new Set<string>();
    const enabledNetworks: EnabledNetwork[] = [];
    for (const { coin } of permissions) {
        if (!coin) continue;
        const key = coin.toLowerCase();
        if (!CARDANO_COINS.has(key) || seen.has(key)) continue;
        seen.add(key);
        // Push the lowercased `key` (a canonical CoinSymbol, 'ada'/'tada') — the raw `coin` is the
        // mixed-case shortcut (e.g. 'ADA') and is not a valid CoinSymbol.
        enabledNetworks.push({ coin: key } as EnabledNetwork);
    }

    return enabledNetworks;
};
