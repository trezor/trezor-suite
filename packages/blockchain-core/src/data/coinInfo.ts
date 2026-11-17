export type BlockchainLinkSettings = { type: string; url: string[] };

/** What the backends need to know about a coin: its default backend. */
export type BackendCoinInfo = {
    type: 'bitcoin' | 'ethereum' | 'misc';
    shortcut: string;
    name: string;
    blockchainLink?: BlockchainLinkSettings;
};
