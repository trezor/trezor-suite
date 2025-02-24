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

export const EVERSTAKE_REWARDS_SOLANA_ENPOINT =
    'https://stake-sync-api.everstake.one/solana/rewards';

export const EVERSTAKE_VALIDATOR = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';
