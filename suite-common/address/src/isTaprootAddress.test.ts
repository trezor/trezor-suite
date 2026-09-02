import {
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { createAddressValidator } from './AddressValidator';
import { isTaprootAddress } from './isTaprootAddress';

const btcSymbol = asNetworkSymbol('btc');

describe('isTaprootAddress', () => {
    const networkModules = createNetworksCompositionRoot();
    const networkModuleRepository = createNetworkModuleRepository({ networkModules });
    const addressValidator = createAddressValidator({
        networkModuleRepository,
    });

    it('returns false for empty string', () => {
        expect(
            isTaprootAddress({
                addressValidator,
                address: '',
                symbol: btcSymbol,
            }),
        ).toBe(false);
    });

    it('returns false for non-taproot addresses', () => {
        expect(
            isTaprootAddress({
                addressValidator,
                address: 'bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj',
                symbol: btcSymbol,
            }),
        ).toBe(false);
        expect(
            isTaprootAddress({
                addressValidator,
                address: 'bc1q6rgl33d3s9dugudw7n68yrryajkr3ha9q8q24j20zs62se4q9tsqdy0t2q',
                symbol: btcSymbol,
            }),
        ).toBe(false);
    });

    it('returns true for taproot addresses', () => {
        expect(
            isTaprootAddress({
                addressValidator,
                address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                symbol: btcSymbol,
            }),
        ).toBe(true);
        expect(
            isTaprootAddress({
                addressValidator,
                address: 'tb1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmts5s7t4c',
                symbol: asNetworkSymbol('test'),
            }),
        ).toBe(true);
    });
});
