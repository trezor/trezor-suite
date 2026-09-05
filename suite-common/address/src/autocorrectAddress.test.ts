import { mockAddressValidator } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { autocorrectAddress } from './autocorrectAddress';

const btcSymbol = asNetworkSymbol('btc');
const bchSymbol = asNetworkSymbol('bch');
const ethSymbol = asNetworkSymbol('eth');

describe('autocorrectAddress', () => {
    it('lowercases an uppercase Bech32 address accepted by the validator', () => {
        const isAddressValid = jest.fn().mockReturnValue(true);
        const addressValidator = mockAddressValidator({ isAddressValid });

        expect(
            autocorrectAddress({
                addressValidator,
                address: 'BC1QAFK4YHQVJ4WEP57M62DGRMUTLDUSQDE8ADH20D',
                symbol: btcSymbol,
            }),
        ).toEqual({
            corrected: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
            type: 'lowercase',
        });
        expect(isAddressValid).toHaveBeenCalledWith(
            'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
            btcSymbol,
        );
    });

    it('lowercases an uppercase CashAddr address accepted by the validator', () => {
        const isAddressValid = jest.fn().mockReturnValue(true);
        const addressValidator = mockAddressValidator({ isAddressValid });

        expect(
            autocorrectAddress({
                addressValidator,
                address: 'BITCOINCASH:QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC',
                symbol: bchSymbol,
            }),
        ).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'lowercase',
        });
    });

    it('adds the prefix and lowercases a prefixless BCH address accepted by the validator', () => {
        const isAddressValid = jest.fn().mockReturnValue(true);
        const addressValidator = mockAddressValidator({ isAddressValid });

        expect(
            autocorrectAddress({
                addressValidator,
                address: 'QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC',
                symbol: bchSymbol,
            }),
        ).toEqual({
            corrected: 'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            type: 'bchPrefix',
        });
        expect(isAddressValid).toHaveBeenCalledWith(
            'bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
            bchSymbol,
        );
    });

    it('does not correct a candidate rejected by the validator', () => {
        const isAddressValid = jest.fn().mockReturnValue(false);
        const addressValidator = mockAddressValidator({ isAddressValid });

        expect(
            autocorrectAddress({
                addressValidator,
                address: 'BC1SW50QA3JX3S',
                symbol: ethSymbol,
            }),
        ).toBeNull();
        expect(isAddressValid).toHaveBeenCalledWith('bc1sw50qa3jx3s', ethSymbol);
    });

    it('does not validate an address which does not need correction', () => {
        const isAddressValid = jest.fn();
        const addressValidator = mockAddressValidator({ isAddressValid });

        expect(
            autocorrectAddress({
                addressValidator,
                address: 'bc1qafk4yhqvj4wep57m62dgrmutldusqde8adh20d',
                symbol: btcSymbol,
            }),
        ).toBeNull();
        expect(isAddressValid).not.toHaveBeenCalled();
    });

    it('does not add the BCH prefix on another network', () => {
        const isAddressValid = jest.fn();
        const addressValidator = mockAddressValidator({ isAddressValid });

        expect(
            autocorrectAddress({
                addressValidator,
                address: 'qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc',
                symbol: btcSymbol,
            }),
        ).toBeNull();
        expect(isAddressValid).not.toHaveBeenCalled();
    });
});
