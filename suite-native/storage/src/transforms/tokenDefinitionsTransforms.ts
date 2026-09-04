import { createTransform } from 'redux-persist';

import { type TokenDefinition } from '@suite-common/token-definitions';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

type PersistedTokenDefinitionsState = Record<
    NetworkSymbol,
    { coin?: Pick<TokenDefinition, 'hide' | 'show'> }
>;

export const tokenDefinitionsPersistTransform = createTransform<
    PersistedTokenDefinitionsState,
    PersistedTokenDefinitionsState
>(
    inboundState => {
        const result: PersistedTokenDefinitionsState = {};

        for (const [symbol, definitions] of Object.entries(inboundState)) {
            if (!definitions) continue;
            const networkSymbol = asNetworkSymbol(symbol);
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
    outboundState => outboundState,
    { whitelist: ['tokenDefinitions'] },
);
