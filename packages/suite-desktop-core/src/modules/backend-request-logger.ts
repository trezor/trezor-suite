/**
 * [throwaway: blockchain-link request baseline — DO NOT MERGE]
 *
 * Lowest-layer backend request logger for the request-optimization initiative.
 *
 * On desktop the whole @trezor/connect core (and every blockchain-link worker) runs in this
 * Electron main process, so a single place here can observe all backend traffic:
 *  - HTTP JSON-RPC (Solana @solana/kit, EVM viem) goes through the global `fetch` — patched below.
 *  - WebSocket frames (blockbook family, ripple, blockfrost, stellar, electrum) go through
 *    @trezor/websocket-client, and the Suite logical layer goes through @trezor/blockchain-link;
 *    both call `globalThis.__bclWrite__` (set here) so the sink lives only in this node module.
 *
 * SINKS ARE PLUGGABLE: `write()` fans out to every enabled sink. Today only a local JSONL file
 * sink (env BCL_LOG). A remote sink (e.g. Grafana Loki / a Prometheus push gateway / OTLP) can be
 * added later without touching the taps — see `createGrafanaSink` stub below.
 *
 * Fully inert unless at least one sink is enabled. Analyze locally with `.context/bcl-analyze.mjs`.
 */
import { appendFileSync } from 'fs';

import type { ModuleInit } from './module';

export const SERVICE_NAME = 'backend-request-logger';

type BclEntry = Record<string, unknown>;
type Sink = (entry: BclEntry) => void;

const createFileSink =
    (path: string): Sink =>
    entry => {
        try {
            appendFileSync(path, `${JSON.stringify(entry)}\n`);
        } catch {
            // ignore logging failures
        }
    };

// Future remote sink. Buffer entries and flush on an interval to a push endpoint
// (Grafana Loki push API / Prometheus pushgateway / OTLP collector), reading the URL + auth
// from env (e.g. BCL_GRAFANA_URL). Kept as a stub so adding it needs no change to the taps.
// const createGrafanaSink = (url: string): Sink => { ... batched fetch(url, ...) ... };

export const init: ModuleInit = () => {
    const { logger } = global;

    const sinks: Sink[] = [];
    if (process.env.BCL_LOG) sinks.push(createFileSink(process.env.BCL_LOG));
    // if (process.env.BCL_GRAFANA_URL) sinks.push(createGrafanaSink(process.env.BCL_GRAFANA_URL));
    if (sinks.length === 0) return;

    const write: Sink = entry => {
        const stamped = { ...entry, ts: Date.now() };
        for (const sink of sinks) sink(stamped);
    };
    // shared entry point consumed by the in-code taps in blockchain-link + websocket-client
    (globalThis as unknown as { __bclWrite__?: Sink }).__bclWrite__ = write;

    // wire layer, HTTP: Solana + EVM JSON-RPC funnel through the main-process global fetch
    const originalFetch = globalThis.fetch;
    if (typeof originalFetch === 'function') {
        globalThis.fetch = ((input: any, requestInit?: any) => {
            try {
                const url = typeof input === 'string' ? input : (input?.url ?? String(input));
                const rawBody =
                    requestInit?.body ?? (typeof input === 'object' ? input?.body : undefined);
                let method: unknown;
                if (typeof rawBody === 'string') {
                    const parsed = JSON.parse(rawBody);
                    method = Array.isArray(parsed)
                        ? parsed.map((p: any) => p?.method) // batched JSON-RPC
                        : parsed?.method;
                }
                write({ lvl: 'wire', tr: 'http', url, method });
            } catch {
                // non-JSON / unreadable body — still record the hit
                try {
                    write({
                        lvl: 'wire',
                        tr: 'http',
                        url: typeof input === 'string' ? input : input?.url,
                    });
                } catch {
                    // ignore
                }
            }

            return originalFetch(input, requestInit);
        }) as typeof fetch;
    }

    logger.info(SERVICE_NAME, `backend request logging enabled (${sinks.length} sink(s))`);
};
