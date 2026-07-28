import {
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';

import { createAddressValidator } from './AddressValidator';
import { isTaprootAddress } from './isTaprootAddress';

describe('isTaprootAddress', () => {
    const networkModules = createNetworksCompositionRoot();
    const networkModuleRepository = createNetworkModuleRepository({ networkModules });
    const addressValidator = createAddressValidator({
        networkModuleRepository,
    });

    it('returns false for empty string', () => {
        expect(isTaprootAddress({ addressValidator, address: '', symbol: 'btc' })).toBe(false);
    });

    it('returns false for non-taproot addresses', () => {
        expect(
            isTaprootAddress({
                addressValidator,
                address: 'bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj',
                symbol: 'btc',
            }),
        ).toBe(false);
        expect(
            isTaprootAddress({
                addressValidator,
                address: 'bc1q6rgl33d3s9dugudw7n68yrryajkr3ha9q8q24j20zs62se4q9tsqdy0t2q',
                symbol: 'btc',
            }),
        ).toBe(false);
    });

    it('returns true for taproot addresses', () => {
        expect(
            isTaprootAddress({
                addressValidator,
                address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                symbol: 'btc',
            }),
        ).toBe(true);
        expect(
            isTaprootAddress({
                addressValidator,
                address: 'tb1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmts5s7t4c',
                symbol: 'test',
            }),
        ).toBe(true);
    });
});
