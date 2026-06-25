import type {
    AddressValidator as NetworkAddressValidator,
    NetworkModule,
} from '@network-module/suite-types';

import type { StaticNetworkModules } from '@suite-common/networks';

import { createAddressValidator } from '../AddressValidator';

describe(createAddressValidator.name, () => {
    const btcAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
    const ethAddress = '0x52908400098527886E0F7030069857D2E4169EE7';

    const createNetworkModule = (
        addressValidator: NetworkAddressValidator,
        supportedCoins: string[],
    ): NetworkModule => ({
        addressValidator,
        getSupportedCoins: jest.fn(() => supportedCoins),
        isSupportedCoin: (symbol: string): symbol is string => supportedCoins.includes(symbol),
    });

    it('builds validator lookup once during composition', () => {
        const bitcoinValidator: NetworkAddressValidator = {
            isAddressValid: jest.fn(() => true),
            getAddressType: jest.fn(() => 'p2wpkh'),
        };
        const ethereumValidator: NetworkAddressValidator = {
            isAddressValid: jest.fn(() => true),
            getAddressType: jest.fn(() => 'address'),
        };
        const bitcoinModule = createNetworkModule(bitcoinValidator, ['btc']);
        const ethereumModule = createNetworkModule(ethereumValidator, ['eth']);

        const addressValidator = createAddressValidator({
            networks: {
                networkModules: {
                    bitcoin: bitcoinModule,
                    ethereum: ethereumModule,
                } as unknown as StaticNetworkModules,
            },
        });

        expect(bitcoinModule.getSupportedCoins).toHaveBeenCalledTimes(1);
        expect(ethereumModule.getSupportedCoins).toHaveBeenCalledTimes(1);

        expect(addressValidator.isAddressValid(btcAddress, 'btc')).toBe(true);
        expect(addressValidator.getAddressType(ethAddress, 'eth')).toBe('address');
        expect(addressValidator.getSupportedCoins()).toEqual(['btc', 'eth']);
        expect(addressValidator.getSupportedCoins()).toBe(addressValidator.getSupportedCoins());
        expect(addressValidator.isSupportedCoin('btc')).toBe(true);
        expect(addressValidator.isSupportedCoin('ada')).toBe(false);

        expect(bitcoinModule.getSupportedCoins).toHaveBeenCalledTimes(1);
        expect(ethereumModule.getSupportedCoins).toHaveBeenCalledTimes(1);
    });

    it('returns invalid result for unsupported symbol', () => {
        const addressValidator = createAddressValidator({
            networks: { networkModules: {} as StaticNetworkModules },
        });

        expect(addressValidator.isAddressValid(btcAddress, 'btc')).toBe(false);
        expect(addressValidator.getAddressType(btcAddress, 'btc')).toBeUndefined();
    });
});
