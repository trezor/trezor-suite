import { createMockDeps } from '@suite-common/dependency-injection';
import { type AddressValidatorDep } from '@suite-common/networks';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { isAddressDeprecated } from './isAddressDeprecated';

describe('isAddressDeprecated', () => {
    it.each([
        {
            symbol: asNetworkSymbol('ltc'),
            address: '3legacy',
            valid: true,
            expected: 'LTC_ADDRESS_INFO_URL',
        },
        {
            symbol: asNetworkSymbol('bch'),
            address: '1legacy',
            valid: true,
            expected: 'HELP_CENTER_CASHADDR_URL',
        },
        { symbol: asNetworkSymbol('ltc'), address: '3invalid', valid: false, expected: undefined },
        { symbol: asNetworkSymbol('bch'), address: '1invalid', valid: false, expected: undefined },
    ] as const)('$symbol: $address', ({ symbol, address, valid, expected }) => {
        const deps = createMockDeps<AddressValidatorDep>({
            addressValidator: { isAddressValid: () => valid, getAddressType: null },
        });

        expect(isAddressDeprecated({ ...deps, address, symbol })).toBe(expected);
        expect(deps.addressValidator.isAddressValid).toHaveBeenCalledWith(address, 'btc');
    });

    it.each([
        { symbol: asNetworkSymbol('ltc'), address: 'Mcurrent' },
        { symbol: asNetworkSymbol('bch'), address: 'bitcoincash:qcurrent' },
        { symbol: asNetworkSymbol('btc'), address: '3current' },
    ] as const)('ignores non-deprecated formats: $symbol $address', ({ symbol, address }) => {
        const deps = createMockDeps<AddressValidatorDep>({
            addressValidator: { isAddressValid: null, getAddressType: null },
        });

        expect(isAddressDeprecated({ ...deps, address, symbol })).toBeUndefined();
    });
});
