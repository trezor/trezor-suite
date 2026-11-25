import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';

/**
 * Whether the network's stake stays inside the account balance, as a Cardano delegation does: the
 * whole balance stays spendable, and the stake is no amount on top of it.
 */
export const isStakeInsideAccountBalance = (networkSymbol: NetworkSymbol) =>
    getNetworkType(networkSymbol) === 'cardano';
