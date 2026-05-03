import { toWei } from 'web3-utils';

import { type NetworkSymbol } from '@suite-common/wallet-config';

export const AUTO_STAKED_SYMBOLS: NetworkSymbol[] = ['ada'] as const;

export const ethToWei = (amount: string): string => toWei(amount, 'ether');
