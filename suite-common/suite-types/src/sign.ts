import { BigNumber } from '@trezor/utils/src/bigNumber';

export type SignOperator = 'positive' | 'negative';

export type SignValue = SignOperator | BigNumber | number | null;
