import { BigNumber } from '@trezor/utils';

import { AmountUnit, asAmountSubunit, asAmountUnit } from '../AmountTypes';

export const test_ok: AmountUnit<'btc'> = asAmountUnit(new BigNumber(1), 'btc');

// @ts-expect-error
export const testErrorSymbolMismatch: AmountUnit<'btc'> = asAmountUnit(new BigNumber(1), 'eth');

// @ts-expect-error
export const testErrorSubunit: AmountUnit<'btc'> = asAmountSubunit(new BigNumber(1), 'btc');
