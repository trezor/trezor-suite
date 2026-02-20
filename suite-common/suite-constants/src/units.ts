import { PROTO } from '@trezor/connect';

export const UNIT_ABBREVIATIONS = {
    [PROTO.AmountUnit.BITCOIN]: 'BTC',
    [PROTO.AmountUnit.MICROBITCOIN]: 'μBTC',
    [PROTO.AmountUnit.MILLIBITCOIN]: 'mBTC',
    [PROTO.AmountUnit.SATOSHI]: 'sat',
};

export const UNIT_LABELS = {
    [PROTO.AmountUnit.BITCOIN]: 'Bitcoin',
    [PROTO.AmountUnit.SATOSHI]: 'Satoshis',
};

export const UNIT_OPTIONS = [
    { label: UNIT_LABELS[PROTO.AmountUnit.BITCOIN], value: PROTO.AmountUnit.BITCOIN },
    { label: UNIT_LABELS[PROTO.AmountUnit.SATOSHI], value: PROTO.AmountUnit.SATOSHI },
];

export type UNIT_ABBREVIATION = (typeof UNIT_ABBREVIATIONS)[PROTO.AmountUnit];
