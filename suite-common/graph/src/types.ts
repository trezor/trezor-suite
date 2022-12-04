import { NetworkSymbol } from '@suite-common/wallet-config';

export type FiatGraphPoint = {
    timestamp: number;
    fiatBalance: number;
};

export type FiatGraphPointWithCryptoBalance = {
    cryptoBalance: string;
} & FiatGraphPoint;

export type AccountItem = {
    coin: NetworkSymbol;
    descriptor: string;
};
