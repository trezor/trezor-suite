import { createTransform } from 'redux-persist';

import { type TokenDefinitionsState } from '@suite-common/token-definitions';

type PersistedTokenDefinitionsState = {
    [symbol: string]: {
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
            result[symbol] = {};

            if (definitions.coin) {
                result[symbol].coin = {
                    hide: definitions.coin.hide ?? [],
                    show: definitions.coin.show ?? [],
                };
            }
        }

        return result;
    },
    outboundState => outboundState as TokenDefinitionsState,
    { whitelist: ['tokenDefinitions'] },
);
