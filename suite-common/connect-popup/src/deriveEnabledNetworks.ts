import { type EnabledNetwork, type PermissionRequest } from '@trezor/connect';

// Today `enabledNetworks` only gates Cardano `derive_cardano`, so project ONLY Cardano grants;
// grants for other coins stay pure authorization for now.
// TODO(#23879): generalize once enabledNetworks drives more than Cardano derivation.
const CARDANO_COINS = new Set(['ada', 'tada']);

/** Projects granted per-coin permissions into the Cardano networks to enable in `@trezor/connect`. */
export const deriveCardanoEnabledNetworks = (
    permissions: PermissionRequest[],
): EnabledNetwork[] => {
    const seen = new Set<string>();
    const networks: EnabledNetwork[] = [];
    for (const { coin } of permissions) {
        if (!coin) continue;
        const key = coin.toLowerCase();
        if (!CARDANO_COINS.has(key) || seen.has(key)) continue;
        seen.add(key);
        // Push the lowercased `key` (a canonical CoinSymbol, 'ada'/'tada') — the raw `coin` is the
        // mixed-case shortcut (e.g. 'ADA') and is not a valid CoinSymbol.
        networks.push({ coin: key } as EnabledNetwork);
    }

    return networks;
};
