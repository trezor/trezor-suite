import {
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';

import { createAddressValidator } from './AddressValidator';
import { autocorrectAddress } from './autocorrectAddress';

describe('autocorrectAddress', () => {
    const networkModules = createNetworksCompositionRoot();
    const networkModuleRepository = createNetworkModuleRepository({ networkModules });
    const addressValidator = createAddressValidator({
        networkModuleRepository,
    });

    it('lowercases uppercase bech32 BTC address', () => {
        expect(
            autocorrectAddress({
                addressValidator,
                address: 'BC1QAFK4YHQVJ4WEP57M62DGRMUTLDUSQDE8ADH20D',
                symbol: 'btc',
            }),
        ).toEqual({
            corrected: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
            type: 'lowercase',
        });
    });

    it('lowercases uppercase bech32 LTC address', () => {
        expect(
            autocorrectAddress({
                addressValidator,
                address: 'LTC1QKZYARPKHDECU5RZEUJ78PWPR5SFM798AFNY4N6',
                symbol: 'ltc',
            }),
        ).toEqual({
            corrected: 'ltc1qkzyarpkhdecu5rzeuj78pwpr5sfm798afny4n6',
            type: 'lowercase',
        });
    });

    it('lowercases uppercase BCH CashAddr address', () => {
        expect(
            autocorrectAddress({
                addressValidator,
                address: 'BITCOINCASH:QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC',
                symbol: 'bch',
            }),
        ).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'lowercase',
        });
    });

    it('adds bitcoincash: prefix to BCH address without it', () => {
        const result = autocorrectAddress({
            addressValidator,
            address: 'qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            symbol: 'bch',
        });
        expect(result).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'bchPrefix',
        });
    });

    it('adds bitcoincash: prefix and lowercases uppercase BCH address without prefix', () => {
        const result = autocorrectAddress({
            addressValidator,
            address: 'QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC',
            symbol: 'bch',
        });
        expect(result).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'bchPrefix',
        });
    });

    it('returns null for already-correct lowercase bech32 address', () => {
        expect(
            autocorrectAddress({
                addressValidator,
                address: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
                symbol: 'btc',
            }),
        ).toBeNull();
    });

    it('returns null for already-correct BCH address with prefix', () => {
        expect(
            autocorrectAddress({
                addressValidator,
                address: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
                symbol: 'bch',
            }),
        ).toBeNull();
    });

    it('returns null for ETH address (no autocorrection needed)', () => {
        expect(
            autocorrectAddress({
                addressValidator,
                address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
                symbol: 'eth',
            }),
        ).toBeNull();
    });

    it('returns null for non-BCH symbol even without prefix', () => {
        expect(
            autocorrectAddress({
                addressValidator,
                address: 'qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
                symbol: 'btc',
            }),
        ).toBeNull();
    });

    it('does not lowercase bech32-looking address on wrong network', () => {
        expect(
            autocorrectAddress({
                addressValidator,
                address: 'BC1SW50QA3JX3S',
                symbol: 'eth',
            }),
        ).toBeNull();
    });
});
