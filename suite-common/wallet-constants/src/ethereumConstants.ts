import { BigNumber } from '@trezor/utils';

// Native balance kept aside so a follow-up transaction can still cover its fee. Staking reserves
// it for the exit fee and wrapping for the approve + deposit pair, so it stays here rather than
// with the staking constants in @suite-common/wallet-core.
export const MIN_ETH_BALANCE_FOR_FEE_BUFFER = new BigNumber(0.005);
