import { BigNumber } from '@trezor/utils';

export const MIN_CARDANO_AMOUNT_FOR_SEND = new BigNumber(1_000_000);

// Protocol deposit locked when a stake key is registered, refunded on deregistration. Kept here
// rather than with the staking constants in wallet-core so packages that only need the value
// (e.g. e2e assertions) do not have to depend on the wallet core.
export const CARDANO_STAKING_REGISTRATION_DEPOSIT = '2';
