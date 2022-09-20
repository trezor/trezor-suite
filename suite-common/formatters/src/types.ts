import { PROTO } from '@trezor/connect';

export type FormatterConfig = {
    locale: string;
    bitcoinAmountUnit: PROTO.AmountUnit;
};
