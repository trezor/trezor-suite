import { createTransform } from 'redux-persist';

import { type TokenDefinitionsState } from '@suite-common/token-definitions';
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
    outboundState => outboundState as TokenDefinitionsState,
    { whitelist: ['tokenDefinitions'] },
);
