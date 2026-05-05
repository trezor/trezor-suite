import { UINT256_MAX } from '@suite-common/suite-constants';
import { BigNumber } from '@trezor/utils';

import { asAmountUnit } from './AmountTypes';
import { unitsToSubunits } from './amountUtils';

export const isAllowanceUnlimited = (amountUnits: string, decimals: number): boolean =>
    new BigNumber(
        unitsToSubunits({ value: asAmountUnit(new BigNumber(amountUnits)), decimals }),
    ).eq(new BigNumber(UINT256_MAX));
