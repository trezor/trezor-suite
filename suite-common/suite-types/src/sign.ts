import BigNumber from 'bignumber.js';

export type SignOperator = 'positive' | 'negative';

export type SignValue = string | BigNumber | number | SignOperator | null;
