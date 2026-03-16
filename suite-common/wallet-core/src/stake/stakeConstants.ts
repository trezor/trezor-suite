import { type SupportedSolanaNetworkSymbols } from '@suite-common/staking-solana-types';
import { EVERSTAKE_SOLANA_MAINNET_VALIDATOR } from '@suite-common/wallet-config';
import {
    type SupportedCardanoNetworkSymbols,
    type SupportedEthereumNetworkSymbol,
} from '@suite-common/wallet-types';

import { type VotingDelegationOption } from './stakeActions';

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

export const EVERSTAKE_VALIDATOR = EVERSTAKE_SOLANA_MAINNET_VALIDATOR;
export const EVERSTAKE_API_KEY = '70ab9ee4-7699-47af-9f79-ad85aee1d490';

export const DEFAULT_VOTING_OPTION: VotingDelegationOption = { type: 'everstake' };
