import { type BigNumber } from '@trezor/utils';

export type SignOperator = 'positive' | 'negative';

export type SignValue = SignOperator | BigNumber | number | null;
