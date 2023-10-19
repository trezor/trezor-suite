import BigNumber from 'bignumber.js';

export type SignOperator = 'positive' | 'negative';

export type SignValue = SignOperator | BigNumber | number | null;
