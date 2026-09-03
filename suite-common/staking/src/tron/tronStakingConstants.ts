import { LUGANODES_TRON_SRS, P2P_ORG_TRON_SRS } from '@suite-common/wallet-config';
import { type TronTxContractType } from '@suite-common/wallet-constants';
import { BigNumber } from '@trezor/utils';

export const MIN_TRON_AMOUNT_FOR_STAKING = new BigNumber(1);
export const MAX_TRON_AMOUNT_FOR_STAKING = new BigNumber(1_000_000_000);
export const MIN_TRON_FOR_WITHDRAWALS = new BigNumber(0.01);
export const MIN_TRON_BALANCE_FOR_FEE_BUFFER = new BigNumber(5);
export const TRON_STAKING_RESERVE = new BigNumber(0.5);
export const MIN_TRON_BALANCE_FOR_STAKING =
    MIN_TRON_AMOUNT_FOR_STAKING.plus(MIN_TRON_FOR_WITHDRAWALS);

// TODO: return these from the API
export const LUGANODES_TERMS_OF_SERVICE_URL = 'https://luganodes.com/terms-of-service';
export const P2P_ORG_TERMS_OF_SERVICE_URL = 'https://www.p2p.org/terms-of-use';

export const TRON_REPRESENTATIVE_TERMS_OF_SERVICE_URLS: Record<string, string> = {
    [LUGANODES_TRON_SRS[0] as string]: LUGANODES_TERMS_OF_SERVICE_URL,
    [P2P_ORG_TRON_SRS[0] as string]: P2P_ORG_TERMS_OF_SERVICE_URL,
};

export const TRON_STAKING_CONTRACT_TYPES: TronTxContractType[] = [
    'FreezeBalanceContract',
    'FreezeBalanceV2Contract',
    'UnfreezeBalanceContract',
    'UnfreezeBalanceV2Contract',
    'VoteWitnessContract',
    'WithdrawExpireUnfreezeContract',
    'WithdrawBalanceContract',
];
