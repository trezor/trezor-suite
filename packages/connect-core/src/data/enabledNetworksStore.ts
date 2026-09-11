/**
 * Runtime store for the application-declared set of enabled networks, keyed by coin symbol.
 * `init` replaces the set; `updateConnectSettings` widens it additively.
 */

import { type EnabledNetwork, isCoinSymbol } from '@trezor/connect-common';

let networks: ReadonlyMap<string, EnabledNetwork> = new Map();

// Untrusted 3rd-party input: keep only entries with a known `CoinSymbol`, dropping the rest rather
// than throwing. `coin` is lowercased so mixed-case input matches `has()` lookups. The entry is
// never spread — only whitelisted fields are copied — so attacker-chosen keys can't reach consumers
// via `getSettings().enabledNetworks`.
const sanitize = (input: unknown): EnabledNetwork[] =>
    Array.isArray(input)
        ? input.flatMap((entry): EnabledNetwork[] => {
              const coin = (entry as Partial<EnabledNetwork>)?.coin;
              if (typeof coin !== 'string') return [];
              const symbol = coin.toLowerCase();

              return isCoinSymbol(symbol) ? [{ coin: symbol }] : [];
          })
        : [];

export const get = (): EnabledNetwork[] => [...networks.values()];

export const has = (coin: string): boolean => networks.has(coin.toLowerCase());

export const set = (next: unknown): void => {
    networks = new Map(sanitize(next).map(network => [network.coin, network]));
};

// Disabling a coin at runtime is intentionally not propagated — Connect keeps deriving, which is
// harmless, and a fresh `init` resets the set anyway.
export const add = (extra: unknown): void => {
    const next = new Map(networks);
    sanitize(extra).forEach(network => next.set(network.coin, network));
    networks = next;
};
