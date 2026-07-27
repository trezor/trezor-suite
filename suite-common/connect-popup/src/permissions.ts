import { networks } from '@suite-common/wallet-config';
import {
    type CoinSymbol,
    type EnabledNetwork,
    type PermissionRequest,
    isCoinSymbol,
} from '@trezor/connect';
import { unique } from '@trezor/utils/src/unique';

// A `PermissionRequest.coin` is the canonical lowercase `CoinSymbol`: call-derived permissions are
// lowercased in `coinPerm`, host-declared ones in `sanitizeRequestedPermissions`. Everything below
// therefore compares coins with `===`.

// There are permissions that depend on a coin, e.g. `read_address` for Bitcoin.
// There are also permissions that are not scoped to a coin, e.g. `management`.
export type GroupedPermissions = {
    coin?: CoinSymbol;
    permissions: PermissionRequest['permission'][];
};

// When a coin group is collapsed, at most this many permission icons are
// previewed next to its heading (shared by the web and native UIs).
export const PERMISSION_PREVIEW_LIMIT = 6;

/**
 * Map a `PermissionRequest.coin` (the canonical lowercase `CoinSymbol`, e.g.
 * `btc`, `eth`, `ltc`) to a human-readable network name. Falls back to the
 * upper-case shortcut when the coin is not known to suite (e.g. an altcoin
 * recognised only by `@trezor/connect`).
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
    const order: (CoinSymbol | undefined)[] = [];
    const byCoin = new Map<CoinSymbol | undefined, PermissionRequest['permission'][]>();

    for (const { coin, permission } of permissions) {
        if (!byCoin.has(coin)) {
            byCoin.set(coin, []);
            order.push(coin);
        }
        byCoin.get(coin)!.push(permission);
    }

    const coinFirst = order.filter((c): c is CoinSymbol => c !== undefined);
    const groups: GroupedPermissions[] = coinFirst.map(coin => ({
        coin,
        permissions: unique(byCoin.get(coin)!),
    }));
    if (byCoin.has(undefined)) {
        groups.push({ permissions: unique(byCoin.get(undefined)!) });
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
    'read_features',
    'sign',
    'sign_message',
    'verify_message',
    'push_tx',
]);

// Sanitize the host-declared `requestedPermissions`: drop entries whose permission is not
// grantable, `push_tx` on deeplinks, and unknown coins; lowercase each `coin` to its `CoinSymbol`.
export const sanitizeRequestedPermissions = (
    requested: PermissionRequest[] | undefined,
    isDeeplink: boolean,
): PermissionRequest[] =>
    (requested ?? []).flatMap(({ permission, coin }) => {
        if (!GRANTABLE_PERMISSIONS.has(permission)) return [];
        if (permission === 'push_tx' && isDeeplink) return [];
        if (coin === undefined) return [{ permission }];
        const symbol = coin.toLowerCase();

        return isCoinSymbol(symbol) ? [{ permission, coin: symbol }] : [];
    });

// Lowercase each permission's `coin` to its `CoinSymbol`. Normalizes grants persisted before coins
// were canonicalized at the source.
export const canonicalizePermissionCoins = (
    permissions: PermissionRequest[],
): PermissionRequest[] =>
    permissions.map(permission =>
        permission.coin === undefined
            ? permission
            : { ...permission, coin: permission.coin.toLowerCase() as CoinSymbol },
    );

// Union two permission lists, de-duplicated by (permission, coin). `base` comes first, so on a
// collision its entry wins.
export const mergePermissions = (
    base: PermissionRequest[],
    extra: PermissionRequest[],
): PermissionRequest[] => {
    const seen = new Set<string>();
    const out: PermissionRequest[] = [];
    for (const permission of [...base, ...extra]) {
        const key = `${permission.permission}:${permission.coin ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(permission);
    }

    return out;
};

// Today `enabledNetworks` only gates Cardano `derive_cardano`, so project ONLY Cardano grants;
// grants for other coins stay pure authorization for now.
// TODO(#23879): generalize once enabledNetworks drives more than Cardano derivation.
const CARDANO_COINS: ReadonlySet<CoinSymbol> = new Set(['ada', 'tada']);

/** Projects granted per-coin permissions into the Cardano networks to enable in `@trezor/connect`. */
export const deriveCardanoEnabledNetworks = (
    permissions: PermissionRequest[],
): EnabledNetwork[] => {
    const seen = new Set<CoinSymbol>();
    const enabledNetworks: EnabledNetwork[] = [];
    for (const { coin } of permissions) {
        if (!coin || !CARDANO_COINS.has(coin) || seen.has(coin)) continue;
        seen.add(coin);
        enabledNetworks.push({ coin });
    }

    return enabledNetworks;
};
