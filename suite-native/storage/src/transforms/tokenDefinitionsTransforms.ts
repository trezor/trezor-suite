import { createTransform } from 'redux-persist';

import { type LegacyNetworkSymbol } from '@suite-common/legacy-network-config';
import { DefinitionType, type TokenDefinitionsState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type PersistedTokenDefinitions = {
    coin?: { hide: string[]; show: string[] };
};

// Mirrors TokenDefinitionsState, whose entries are optional.
type PersistedTokenDefinitionsState = {
    [TSymbol in LegacyNetworkSymbol]?: PersistedTokenDefinitions;
};

export const tokenDefinitionsPersistTransform = createTransform<
    TokenDefinitionsState,
    PersistedTokenDefinitionsState
>(
    inboundState => {
        const result: PersistedTokenDefinitionsState = {};

        for (const [symbol, definitions] of Object.entries(inboundState)) {
            if (!definitions) continue;
            const persisted: PersistedTokenDefinitions = {};

            if (definitions.coin) {
                persisted.coin = {
                    hide: definitions.coin.hide ?? [],
                    show: definitions.coin.show ?? [],
                };
            }

            result[symbol as LegacyNetworkSymbol] = persisted;
        }

        return result;
    },
    outboundState => {
        const result: TokenDefinitionsState = {};

        for (const [symbol, persisted] of Object.entries(outboundState)) {
            if (!persisted?.coin) continue;

            // Only the user's hide/show lists are persisted; the fetch state starts clean.
            result[symbol as NetworkSymbol] = {
                [DefinitionType.COIN]: {
                    error: false,
                    isLoading: false,
                    hide: persisted.coin.hide,
                    show: persisted.coin.show,
                },
            };
        }

        return result;
    },
    { whitelist: ['tokenDefinitions'] },
);
