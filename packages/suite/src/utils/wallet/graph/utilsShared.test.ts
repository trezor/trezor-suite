import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { type FiatValueMap } from './types';
import { sumFiatValueMapInPlace } from './utilsShared';

describe('sumFiatValueMapInPlace', () => {
    it('adds the values of the second map to the first one', () => {
        const valueMap: FiatValueMap = { usd: asBaseCurrencyAmount(new BigNumber(1)) };

        sumFiatValueMapInPlace(valueMap, {
            usd: asBaseCurrencyAmount(new BigNumber(2)),
            eur: asBaseCurrencyAmount(new BigNumber(3)),
        });

        expect(valueMap.usd?.toFixed()).toBe('3');
        expect(valueMap.eur?.toFixed()).toBe('3');
    });

    it('skips keys from backend rates that would reach Object.prototype', () => {
        const valueMap: FiatValueMap = { usd: asBaseCurrencyAmount(new BigNumber(1)) };
        // JSON.parse creates "__proto__" as an own key, as a backend response would.
        const backendValues = JSON.parse('{"usd":"2","__proto__":"3","constructor":"4"}');

        sumFiatValueMapInPlace(valueMap, backendValues);

        expect(Object.getPrototypeOf(valueMap)).toBe(Object.prototype);
        expect(Object.keys(valueMap)).toEqual(['usd']);
        expect(valueMap.usd?.toFixed()).toBe('3');
    });
});
