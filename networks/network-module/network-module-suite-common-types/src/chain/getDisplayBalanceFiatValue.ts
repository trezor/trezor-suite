import { BigNumber } from '@trezor/utils';

import type { ChainNetwork } from './ChainNetwork';

/** Fiat value of the balance the network displays: the rule for networks without extra assets. */
export const getDisplayBalanceFiatValue: ChainNetwork['getAccountFiatBalance'] = params =>
    new BigNumber(params.balance.displayBalance).times(params.rate.rate).toString(10);
