import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber, typedObjectEntries } from '@trezor/utils';

import { type FiatValueMap } from './types';

/**
 * Mutates the first object param and adds values from second object.
 *
 * @param {{ string: string | undefined }} valueMap
 * @param {{ string: string | undefined }} obj
 * @returns
 */
export const sumFiatValueMapInPlace = (valueMap: FiatValueMap, obj: FiatValueMap) => {
    typedObjectEntries(obj).forEach(keyVal => {
        const [key, val] = keyVal;
        const previousValue = valueMap[key] ?? asBaseCurrencyAmount(new BigNumber(0));
        valueMap[key] = asBaseCurrencyAmount(new BigNumber(previousValue).plus(val ?? 0));
    });
};
