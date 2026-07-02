// Selects the source from which coin definitions (e.g. Ethereum network, token and clear-signing
// display-format) are downloaded. Defaults to `production` when unset.
export const DEFINITIONS_CHANNELS = ['production', 'development', 'local'] as const;
export type DefinitionsChannel = (typeof DEFINITIONS_CHANNELS)[number];
