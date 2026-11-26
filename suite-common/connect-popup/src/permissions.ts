import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type CoinSymbol,
    type EnabledNetwork,
    GRANTABLE_PERMISSIONS,
    type PermissionRequest,
    asCoinSymbol,
    isCoinSymbol,
} from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';
import { isArrayMember } from '@trezor/utils';
import { unique } from '@trezor/utils/src/unique';

import {
    CALL_SOURCE_DEEPLINK,
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_MCP,
    CALL_SOURCE_WALLETCONNECT,
    CALL_SOURCE_WEB,
    type ConnectCallSource,
    type ConnectProcessInfo,
    UNKNOWN_PROCESS,
} from './connectPopupTypes';

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
    const key = shortcut.toLowerCase() as NetworkSymbol;

    return getNetwork(key)?.name ?? shortcut.toUpperCase();
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
    // On native, an app remembered before 26.7.1 rehydrates without `allowedPermissions` (formerly
    // `types`), so `granted` can be undefined. It must cover nothing, so the user is asked again.
    Array.isArray(granted) &&
    requested.every(req =>
        granted.some(g => g.permission === req.permission && g.coin === req.coin),
    );

// The empty string and `null`, which browsers send for every sandboxed or local page. Every caller
// holding one would compare equal to every other caller holding it.
const UNESTABLISHED_ORIGINS: ReadonlySet<string> = new Set(['', 'null']);

/**
 * Whether `origin` identifies a caller. It does not when it is one of `UNESTABLISHED_ORIGINS`, a
 * wildcard such as the `*` a window message carries until the handshake attributes it to an origin
 * (also as a part of one, as in `https://*.example.com`), a scheme with no host (`myapp://`, what a
 * deeplink callback URL without a host leaves of its origin), or padded with whitespace. The origin
 * is stored and compared as it is, so a padded one would never equal the caller's own.
 */
export const isEstablishedOrigin = (origin: unknown): origin is string =>
    typeof origin === 'string' &&
    origin === origin.trim() &&
    !UNESTABLISHED_ORIGINS.has(origin) &&
    !origin.includes('*') &&
    !origin.endsWith('://');

/**
 * Whether permissions remembered for `app` belong to the caller `source`: the same source type,
 * origin and process. Both origins must be established, so a grant matched only by an unknown or
 * wildcard origin is never reused by another caller.
 */
export const isSameConnectApp = (app: ConnectCallSource, source: ConnectCallSource): boolean =>
    isEstablishedOrigin(app.origin) &&
    isEstablishedOrigin(source.origin) &&
    app.type === source.type &&
    app.origin === source.origin &&
    app.process?.fullPath === source.process?.fullPath;

// A process is told apart from other processes of the same origin only by its full path (see
// `isSameConnectApp`), so a blank path identifies nothing — just like the `UNKNOWN_PROCESS`
// placeholder Suite substitutes when the main process could not identify the caller at all. The
// path is checked for being a string because persisted grants reach this predicate unvalidated
// (see the `storageLoad` case of `connectPopupReducer`), and such an entry must be dropped, not
// thrown on.
export const isIdentifiedProcess = (process: ConnectProcessInfo): boolean =>
    typeof process.fullPath === 'string' &&
    process.fullPath.trim() !== '' &&
    process.fullPath !== UNKNOWN_PROCESS.fullPath;

/**
 * Permissions are remembered only for a caller that can be told apart from others: with an
 * established origin, not for a process that could not be identified. WalletConnect is excluded
 * too: its consent lives in its own session. A source with no `process` at all (web, deeplink) is
 * told apart by its origin alone. MCP is the exception: its origin is the constant
 * `mcp://localhost`, so every MCP caller without a resolved process would share one grant — an
 * identified process is required for it instead.
 */
export const canRememberPermissions = (source: ConnectCallSource): boolean =>
    source.type !== CALL_SOURCE_WALLETCONNECT &&
    isEstablishedOrigin(source.origin) &&
    (source.type === CALL_SOURCE_MCP
        ? !!source.process && isIdentifiedProcess(source.process)
        : !source.process || isIdentifiedProcess(source.process));

/**
 * Whether a call from `source` may be processed at all. A caller told apart by its origin must have
 * an established one: a call that arrives without it cannot be attributed to an app, so the user
 * would be asked to trust a name they cannot check.
 * - A web caller: the popup link starts at `*` and only narrows it from the bootstrap handshake.
 * - A desktop caller: the `Origin` header of its WebSocket call is passed on as it is, and the main
 *   process drops only a missing one, so a literal `null` or `*` reaches Suite.
 *
 * The other sources are not refused on it. MCP names its caller by one constant origin and a
 * deeplink by the scheme and host of its callback URL: a call of theirs whose origin is still not
 * established is asked about every time and never remembered. WalletConnect's origin can be empty
 * for an unverified dapp, which its own session consent covers.
 */
export const canProcessCall = (source: ConnectCallSource): boolean => {
    switch (source.type) {
        case CALL_SOURCE_WEB:
        case CALL_SOURCE_DESKTOP_WS:
            return isEstablishedOrigin(source.origin);
        case CALL_SOURCE_DEEPLINK:
        case CALL_SOURCE_MCP:
        case CALL_SOURCE_WALLETCONNECT:
            return true;
        default:
            return exhaustive(source);
    }
};

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

// Runtime guard narrowing the untrusted `permission` value against the imported grantable set,
// mirroring `isCoinSymbol` for coins.
const isGrantablePermission = (value: string): value is PermissionRequest['permission'] =>
    isArrayMember(value, GRANTABLE_PERMISSIONS);

// Sanitize the host-declared `requestedPermissions`: drop entries whose permission is not
// grantable, `push_tx` on deeplinks, and unknown coins; lowercase each `coin` to its `CoinSymbol`.
//
// Untrusted input — nothing schema-validates it on either handshake, hence `unknown` and the shape
// checks. Malformed input is dropped rather than thrown on, because this runs before
// `initiateCall`: a throw there fails every later call from that app with an unactionable error.
// Entries are never spread, so attacker-chosen keys cannot reach the consent UI or the grant.
export const sanitizeRequestedPermissions = (
    requested: unknown,
    isDeeplink: boolean,
): PermissionRequest[] =>
    Array.isArray(requested)
        ? requested.flatMap((entry): PermissionRequest[] => {
              const { permission, coin } = (entry ?? {}) as {
                  permission?: unknown;
                  coin?: unknown;
              };
              if (typeof permission !== 'string' || !isGrantablePermission(permission)) return [];
              if (permission === 'push_tx' && isDeeplink) return [];
              // Only an absent coin means coin-less. A malformed one is dropped, not widened —
              // a coin-less grant is device-wide, so widening would fail open.
              if (coin === undefined) return [{ permission }];
              if (typeof coin !== 'string') return [];
              const symbol = coin.toLowerCase();

              return isCoinSymbol(symbol) ? [{ permission, coin: symbol }] : [];
          })
        : [];

// Lowercase each permission's `coin` to its `CoinSymbol`. Normalizes grants persisted before coins
// were canonicalized at the source.
export const canonicalizePermissionCoins = (
    permissions: PermissionRequest[],
): PermissionRequest[] =>
    permissions.map(permission =>
        permission.coin === undefined
            ? permission
            : { ...permission, coin: asCoinSymbol(permission.coin.toLowerCase()) },
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
