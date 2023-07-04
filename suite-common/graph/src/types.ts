import { NetworkSymbol } from '@suite-common/wallet-config';

export type FiatGraphPoint = {
    date: Date;
    value: number;
};

export type FiatGraphPointWithCryptoBalance = {
    cryptoBalance: string;
} & FiatGraphPoint;

export type AccountItem = {
    coin: NetworkSymbol;
    descriptor: string;
};
