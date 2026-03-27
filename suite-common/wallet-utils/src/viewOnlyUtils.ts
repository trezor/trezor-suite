import { type NetworkSymbol } from '@suite-common/wallet-config';

export const isViewOnlySymbol = (symbol?: NetworkSymbol) => symbol === 'trx';
