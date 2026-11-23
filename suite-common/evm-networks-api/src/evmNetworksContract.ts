import { type Result, err, ok } from '@trezor/type-utils';
import { z } from '@trezor/zod';

import { GetEvmNetworksResponse } from './api';

/** The path this module describes. The path is the version: a breaking change gets a new path, and this one keeps serving. */
export const EVM_NETWORKS_PATH = '/api/v2/evm-networks';

export type EvmNetworksResponse = z.output<typeof GetEvmNetworksResponse>;
export type EvmNetwork = EvmNetworksResponse['networks'][number];
export type EvmNetworkCurrency = EvmNetwork['nativeCurrency'];

export type EvmNetworksParseError = {
    readonly detail: string;
};

const evmNetworkSchema = GetEvmNetworksResponse.shape.networks.element;
// Rows are checked one by one, so one malformed row costs that row, not the list.
const evmNetworksEnvelopeSchema = GetEvmNetworksResponse.extend({
    networks: z.array(z.unknown()),
});

const CAIP2_PATTERN = /^eip155:([1-9][0-9]*)$/;

/** The chain id in an `eip155:` id, or `undefined` for anything else. */
export const getChainIdFromCaip2 = (caip2: unknown): number | undefined => {
    const match = typeof caip2 === 'string' ? CAIP2_PATTERN.exec(caip2) : null;
    const chainId = match === null ? undefined : Number(match[1]);

    return chainId !== undefined && Number.isSafeInteger(chainId) ? chainId : undefined;
};

const isHttps = (url: string) => url.startsWith('https://');

// The schema promises https but only checks for a URL; these become RPC endpoints and image sources.
const keepHttpsUrls = ({ rpcUrls, explorerUrl, iconUrl, ...network }: EvmNetwork): EvmNetwork => ({
    ...network,
    rpcUrls: rpcUrls.filter(isHttps),
    ...(explorerUrl !== undefined && isHttps(explorerUrl) ? { explorerUrl } : {}),
    ...(iconUrl !== undefined && isHttps(iconUrl) ? { iconUrl } : {}),
});

/**
 * Reads a response body as untrusted data. Unknown fields are ignored; a row that fails the
 * schema, has no positive safe-integer chain id or repeats a chain id is dropped; a URL that is
 * not `https` is dropped. Only a body that is not this shape at all is an error.
 */
export const parseEvmNetworksResponse = (
    raw: unknown,
): Result<EvmNetworksResponse, EvmNetworksParseError> => {
    const envelope = evmNetworksEnvelopeSchema.safeParse(raw);

    if (!envelope.success) return err({ detail: z.prettifyError(envelope.error) });

    const seenChainIds = new Set<number>();
    const networks = envelope.data.networks.flatMap(value => {
        const row = evmNetworkSchema.safeParse(value);
        const chainId = row.success ? getChainIdFromCaip2(row.data.caip2) : undefined;

        if (!row.success || chainId === undefined || seenChainIds.has(chainId)) return [];

        seenChainIds.add(chainId);

        return [keepHttpsUrls(row.data)];
    });

    return ok({ generatedAt: envelope.data.generatedAt, networks });
};
