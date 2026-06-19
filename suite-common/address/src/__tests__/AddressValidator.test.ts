import type { AddressValidator, NetworkModule } from '@network-module/suite-types';

import { createAddressValidator } from '../AddressValidator';

describe(createAddressValidator.name, () => {
    const btcAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
    const ethAddress = '0x52908400098527886E0F7030069857D2E4169EE7';

    const createNetworkModule = (addressValidator: AddressValidator): NetworkModule => ({
        addressValidator,
    });

    it('builds validator lookup once during composition', () => {
        const bitcoinValidator: AddressValidator = {
            isAddressValid: jest.fn(() => true),
            getAddressType: jest.fn(() => 'p2wpkh'),
            getSupportedCoins: jest.fn(() => ['btc']),
        };
        const ethereumValidator: AddressValidator = {
            isAddressValid: jest.fn(() => true),
            getAddressType: jest.fn(() => 'address'),
            getSupportedCoins: jest.fn(() => ['eth']),
        };

        const addressValidator = createAddressValidator({
            networks: {
                networkModules: new Map([
                    ['bitcoin', createNetworkModule(bitcoinValidator)],
                    ['ethereum', createNetworkModule(ethereumValidator)],
                ]),
            },
        });

        expect(bitcoinValidator.getSupportedCoins).toHaveBeenCalledTimes(1);
        expect(ethereumValidator.getSupportedCoins).toHaveBeenCalledTimes(1);

        expect(addressValidator.isAddressValid(btcAddress, 'btc')).toBe(true);
        expect(addressValidator.getAddressType(ethAddress, 'eth')).toBe('address');
        expect(addressValidator.getSupportedCoins()).toEqual(['btc', 'eth']);

        expect(bitcoinValidator.getSupportedCoins).toHaveBeenCalledTimes(1);
        expect(ethereumValidator.getSupportedCoins).toHaveBeenCalledTimes(1);
    });

    it('returns invalid result for unsupported symbol', () => {
        const addressValidator = createAddressValidator({
            networks: { networkModules: new Map() },
        });

        expect(addressValidator.isAddressValid(btcAddress, 'btc')).toBe(false);
        expect(addressValidator.getAddressType(btcAddress, 'btc')).toBeUndefined();
    });
});
