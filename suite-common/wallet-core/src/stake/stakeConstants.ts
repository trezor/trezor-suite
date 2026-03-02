import { SupportedSolanaNetworkSymbols } from '@suite-common/staking-solana-types';
import {
    SupportedCardanoNetworkSymbols,
    SupportedEthereumNetworkSymbol,
} from '@suite-common/wallet-types';

import { VotingDelegationOption } from './stakeActions';

export const EVERSTAKE_ENDPOINT_PREFIX = {
    eth: 'https://eth-api-b2c.everstake.one/api/v1',
    thod: 'https://eth-api-b2c-stage.everstake.one/api/v1',
    sol: 'https://dashboard-api.everstake.one',
    dsol: 'https://dashboard-api.everstake.one',
    ada: 'https://stats.everstake.one',
} as const satisfies Record<
    SupportedEthereumNetworkSymbol | SupportedSolanaNetworkSymbols | SupportedCardanoNetworkSymbols,
    string
>;

export const EVERSTAKE_REWARDS_SOLANA_ENPOINT =
    'https://stake-sync-api.everstake.one/v1/solana/rewards';

export const EVERSTAKE_VALIDATOR = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';
export const EVERSTAKE_API_KEY = '70ab9ee4-7699-47af-9f79-ad85aee1d490';

export const DEFAULT_VOTING_OPTION: VotingDelegationOption = { type: 'everstake' };
