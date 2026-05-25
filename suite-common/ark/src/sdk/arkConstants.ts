// The PoC targets the Ark signet operator. Mainnet (Arkade beta) is live
// since 2025-10-21 but the arkd repo still warns "do not use in production",
// so signet is the safer default for prototype work.
export const ARK_SIGNET_SERVER_URL = 'https://signet.arkade.sh';
export const ARK_SIGNET_ESPLORA_URL = 'https://mempool.signet.arkade.sh/api';

// Default timeout for any single SDK call. Round participation can take
// tens of seconds, so this is intentionally generous compared to a typical
// REST request.
export const DEFAULT_ARK_TIMEOUT_MS = 60_000;
