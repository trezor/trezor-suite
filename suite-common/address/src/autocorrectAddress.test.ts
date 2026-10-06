import { createMockDeps } from '@suite-common/dependency-injection';
import { type AddressValidatorDep, asNetworkSymbol } from '@suite-common/networks';

import { autocorrectAddress } from './autocorrectAddress';

const btcSymbol = asNetworkSymbol('btc');
const bchSymbol = asNetworkSymbol('bch');
const ethSymbol = asNetworkSymbol('eth');

describe('autocorrectAddress', () => {
    const deps = createMockDeps<AddressValidatorDep>({
        addressValidator: { isAddressValid: null, getAddressType: null },
    });

    beforeEach(() => {
        deps.addressValidator.isAddressValid.mockReset();
        deps.addressValidator.isAddressValid.mockReturnValue(true);
    });

    it('lowercases uppercase bech32 BTC address', () => {
        expect(
            autocorrectAddress({
                addressValidator: deps.addressValidator,
                address: 'BC1QAFK4YHQVJ4WEP57M62DGRMUTLDUSQDE8ADH20D',
                symbol: btcSymbol,
            }),
        ).toEqual({
            corrected: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
            type: 'lowercase',
        });
    });

    it('lowercases uppercase bech32 LTC address', () => {
        expect(
            autocorrectAddress({
                addressValidator: deps.addressValidator,
                address: 'LTC1QKZYARPKHDECU5RZEUJ78PWPR5SFM798AFNY4N6',
                symbol: asNetworkSymbol('ltc'),
            }),
        ).toEqual({
            corrected: 'ltc1qkzyarpkhdecu5rzeuj78pwpr5sfm798afny4n6',
            type: 'lowercase',
        });
    });

    it('lowercases uppercase BCH CashAddr address', () => {
        expect(
            autocorrectAddress({
                addressValidator: deps.addressValidator,
                address: 'BITCOINCASH:QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC',
                symbol: bchSymbol,
            }),
        ).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'lowercase',
        });
    });

    it('adds bitcoincash: prefix to BCH address without it', () => {
        const result = autocorrectAddress({
            addressValidator: deps.addressValidator,
            address: 'qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            symbol: bchSymbol,
        });
        expect(result).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'bchPrefix',
        });
    });

    it('adds bitcoincash: prefix and lowercases uppercase BCH address without prefix', () => {
        const result = autocorrectAddress({
            addressValidator: deps.addressValidator,
            address: 'QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC',
            symbol: bchSymbol,
        });
        expect(result).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'bchPrefix',
        });
    });

    it('returns null for already-correct lowercase bech32 address', () => {
        expect(
            autocorrectAddress({
                addressValidator: deps.addressValidator,
                address: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
                symbol: btcSymbol,
            }),
        ).toBeNull();
    });

    it('returns null for already-correct BCH address with prefix', () => {
        expect(
            autocorrectAddress({
                addressValidator: deps.addressValidator,
                address: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
                symbol: bchSymbol,
            }),
        ).toBeNull();
    });

    it('returns null for ETH address (no autocorrection needed)', () => {
        expect(
            autocorrectAddress({
                addressValidator: deps.addressValidator,
                address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF',
                symbol: ethSymbol,
            }),
        ).toBeNull();
    });

    it('returns null for non-BCH symbol even without prefix', () => {
        expect(
            autocorrectAddress({
                addressValidator: deps.addressValidator,
                address: 'qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
                symbol: btcSymbol,
            }),
        ).toBeNull();
    });

    it('does not lowercase bech32-looking address on wrong network', () => {
        deps.addressValidator.isAddressValid.mockReturnValue(false);

        expect(
            autocorrectAddress({
                addressValidator: deps.addressValidator,
                address: 'BC1SW50QA3JX3S',
                symbol: ethSymbol,
            }),
        ).toBeNull();
        expect(deps.addressValidator.isAddressValid).toHaveBeenCalledWith(
            'bc1sw50qa3jx3s',
            ethSymbol,
        );
    });
});
