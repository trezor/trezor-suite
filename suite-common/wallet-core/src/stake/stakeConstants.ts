import {
    SupportedEthereumNetworkSymbol,
    SupportedSolanaNetworkSymbols,
} from '@suite-common/wallet-types';

export const EVERSTAKE_ENDPOINT_PREFIX: Record<
    SupportedEthereumNetworkSymbol | SupportedSolanaNetworkSymbols,
    string
> = {
    eth: 'https://eth-api-b2c.everstake.one/api/v1',
    thol: 'https://eth-api-b2c-stage.everstake.one/api/v1',
    sol: 'https://dashboard-api.everstake.one',
    dsol: 'https://dashboard-api.everstake.one',
};
