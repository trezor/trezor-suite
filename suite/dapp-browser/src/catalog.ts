import { dappCatalogSchema } from './schemas';
import { type DappCatalogEntry } from './types';

// The curated, allow-listed dApp catalog (§6). Fixed data — no address bar, no
// arbitrary origins. PoC runs on Ethereum mainnet (chainId 1) only (§14); every
// entry is a `general` (non-Trezor-integrated) dApp, so each shows the
// third-party consent interstitial before opening (§6).
//
// Icons are referenced by a stable local key resolved by the renderer — never
// hot-loaded from the dApp origin.

const ETHEREUM_MAINNET = 1;

const rawCatalog: DappCatalogEntry[] = [
    {
        id: 'revoke-cash',
        name: 'Revoke.cash',
        origin: 'https://revoke.cash',
        url: 'https://revoke.cash',
        iconUrl: 'revoke-cash',
        description: 'Review & revoke ERC-20 / NFT token approvals across EVM chains.',
        namespaces: ['eip155'],
        chains: [ETHEREUM_MAINNET],
        trustTier: 'general',
    },
    {
        id: 'lido',
        name: 'Lido',
        origin: 'https://stake.lido.fi',
        url: 'https://stake.lido.fi',
        iconUrl: 'lido',
        description: 'Liquid staking — stake ETH and receive stETH.',
        namespaces: ['eip155'],
        chains: [ETHEREUM_MAINNET],
        trustTier: 'general',
    },
    {
        id: 'midas',
        name: 'Midas',
        origin: 'https://midas.app',
        url: 'https://midas.app',
        iconUrl: 'midas',
        description: 'Tokenized institutional yield / real-world-asset tokens.',
        namespaces: ['eip155'],
        chains: [ETHEREUM_MAINNET],
        trustTier: 'general',
    },
    {
        id: 'zerion',
        name: 'Zerion',
        origin: 'https://app.zerion.io',
        url: 'https://app.zerion.io',
        iconUrl: 'zerion',
        description: 'Multi-chain portfolio tracking + DeFi dashboard.',
        namespaces: ['eip155'],
        chains: [ETHEREUM_MAINNET],
        trustTier: 'general',
    },
];

/** The validated catalog. Throws at load if any entry is malformed (§12). */
export const DAPP_CATALOG: DappCatalogEntry[] = dappCatalogSchema.parse(rawCatalog);

/** The set of allow-listed origins — the only origins the view may load (§12). */
export const CATALOG_ORIGINS: ReadonlySet<string> = new Set(
    DAPP_CATALOG.map(entry => entry.origin),
);

export const getCatalogEntryById = (id: string): DappCatalogEntry | undefined =>
    DAPP_CATALOG.find(entry => entry.id === id);

export const getCatalogEntryByOrigin = (origin: string): DappCatalogEntry | undefined =>
    DAPP_CATALOG.find(entry => entry.origin === origin);

export const isCatalogOrigin = (origin: string): boolean => CATALOG_ORIGINS.has(origin);
