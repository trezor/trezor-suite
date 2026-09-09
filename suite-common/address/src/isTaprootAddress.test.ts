import { mockAddressValidator } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { isTaprootAddress } from './isTaprootAddress';

const btcSymbol = asNetworkSymbol('btc');

describe('isTaprootAddress', () => {
    it('returns true when the validator identifies a Taproot address', () => {
        const getAddressType = jest.fn().mockReturnValue('p2tr');
        const addressValidator = mockAddressValidator({ getAddressType });
        const address = 'taproot-address';

        expect(isTaprootAddress({ addressValidator, address, symbol: btcSymbol })).toBe(true);
        expect(getAddressType).toHaveBeenCalledWith(address, btcSymbol);
    });

    it('returns false when the validator identifies a different address type', () => {
        const getAddressType = jest.fn().mockReturnValue('p2wpkh');
        const addressValidator = mockAddressValidator({ getAddressType });

        expect(
            isTaprootAddress({
                addressValidator,
                address: 'non-taproot-address',
                symbol: btcSymbol,
            }),
        ).toBe(false);
    });
});
