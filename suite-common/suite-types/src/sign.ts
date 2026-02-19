// eslint-disable-next-line local-rules/no-package-deep-imports
import { BigNumber } from '@trezor/utils/src/bigNumber';

export type SignOperator = 'positive' | 'negative';

export type SignValue = SignOperator | BigNumber | number | null;
