import { mockAddressValidator } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { isAddressDeprecated } from './isAddressDeprecated';

const ltcSymbol = asNetworkSymbol('ltc');
const bchSymbol = asNetworkSymbol('bch');

// https://litecoin-project.github.io/p2sh-convert/
// https://cashaddr.bitcoincash.org/
describe('isAddressDeprecated', () => {
    it.each([
        {
            address: '3NP9U8dbNzBcwhChpX8nk4F3Bf2oSucXj1',
            symbol: ltcSymbol,
            expected: 'LTC_ADDRESS_INFO_URL',
        },
        {
            address: '12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y',
            symbol: bchSymbol,
            expected: 'HELP_CENTER_CASHADDR_URL',
        },
    ])('detects a deprecated $symbol address', ({ address, symbol, expected }) => {
        const isAddressValid = jest.fn().mockReturnValue(true);
        const addressValidator = mockAddressValidator({ isAddressValid });

        expect(isAddressDeprecated({ addressValidator, address, symbol })).toBe(expected);
        expect(isAddressValid).toHaveBeenCalledWith(address, 'btc');
    });

    it('does not deprecate an address rejected by the BTC validator', () => {
        const isAddressValid = jest.fn().mockReturnValue(false);
        const addressValidator = mockAddressValidator({ isAddressValid });
        const address = '3notValid';

        expect(
            isAddressDeprecated({ addressValidator, address, symbol: ltcSymbol }),
        ).toBeUndefined();
        expect(isAddressValid).toHaveBeenCalledWith(address, 'btc');
    });

    it('does not validate an address without a deprecated prefix', () => {
        const isAddressValid = jest.fn();
        const addressValidator = mockAddressValidator({ isAddressValid });

        expect(
            isAddressDeprecated({
                addressValidator,
                address: 'LTC1QKZYARPKHDECU5RZEUJ78PWPR5SFM798AFNY4N6',
                symbol: ltcSymbol,
            }),
        ).toBeUndefined();
        expect(isAddressValid).not.toHaveBeenCalled();
    });
});
