import { createTransform } from 'redux-persist';

import { DefinitionType, type TokenDefinitionsState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type PersistedTokenDefinitionsState = {
    [symbol: NetworkSymbol]: {
        coin?: { hide: string[]; show: string[] };
    };
};

export const tokenDefinitionsPersistTransform = createTransform<
    TokenDefinitionsState,
    PersistedTokenDefinitionsState
>(
    inboundState => {
        const result: PersistedTokenDefinitionsState = {};

        for (const [symbol, definitions] of Object.entries(inboundState)) {
            if (!definitions) continue;
            const networkSymbol = symbol as NetworkSymbol;
            result[networkSymbol] = {};

            if (definitions.coin) {
                result[networkSymbol].coin = {
                    hide: definitions.coin.hide ?? [],
                    show: definitions.coin.show ?? [],
                };
            }
        }

        return result;
    },
    // Only hide/show are persisted, so the fetch state is restored here rather than handing the
    // persisted entry back as if it were a full TokenDefinition.
    outboundState => {
        const result: TokenDefinitionsState = {};

        for (const [symbol, persisted] of Object.entries(outboundState)) {
            if (!persisted.coin) continue;

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
