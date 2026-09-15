import { createTransform } from 'redux-persist';

import { DefinitionType, type TokenDefinitionsState } from '@suite-common/token-definitions';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

type PersistedTokenDefinitions = {
    coin?: { hide: string[]; show: string[] };
};

// Mirrors TokenDefinitionsState, whose entries are optional.
type PersistedTokenDefinitionsState = {
    [symbol: NetworkSymbol]: PersistedTokenDefinitions | undefined;
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

            // Object.entries widens the key to string; the persisted shape keeps the branded one.
            result[asNetworkSymbol(symbol)] = persisted;
        }

        return result;
    },
    outboundState => {
        const result: TokenDefinitionsState = {};

        for (const [symbol, persisted] of Object.entries(outboundState)) {
            if (!persisted?.coin) continue;

            // Only the user's hide/show lists are persisted; the fetch state starts clean.
            result[asNetworkSymbol(symbol)] = {
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
