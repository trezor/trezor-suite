import { AmountUnit } from '@trezor/protobuf/src/definitions/messages-bitcoin';

export const UNIT_ABBREVIATIONS = {
    [AmountUnit.BITCOIN]: 'BTC',
    [AmountUnit.MICROBITCOIN]: 'μBTC',
    [AmountUnit.MILLIBITCOIN]: 'mBTC',
    [AmountUnit.SATOSHI]: 'sat',
};

export const UNIT_LABELS = {
    [AmountUnit.BITCOIN]: 'Bitcoin',
    [AmountUnit.SATOSHI]: 'Satoshis',
};

export const UNIT_OPTIONS = [
    { label: UNIT_LABELS[AmountUnit.BITCOIN], value: AmountUnit.BITCOIN },
    { label: UNIT_LABELS[AmountUnit.SATOSHI], value: AmountUnit.SATOSHI },
];

export type UNIT_ABBREVIATION = (typeof UNIT_ABBREVIATIONS)[AmountUnit];
