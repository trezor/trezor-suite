import {
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';

import { createAddressValidator } from './AddressValidator';
import { isAddressDeprecated } from './isAddressDeprecated';

// https://litecoin-project.github.io/p2sh-convert/
// https://cashaddr.bitcoincash.org/
describe('isAddressDeprecated', () => {
    const networkModules = createNetworksCompositionRoot();
    const networkModuleRepository = createNetworkModuleRepository({ networkModules });
    const addressValidator = createAddressValidator({
        networkModuleRepository,
    });

    it('returns undefined for non-deprecated LTC address', () => {
        expect(isAddressDeprecated({ addressValidator, address: '3notValid', symbol: 'ltc' })).toBe(
            undefined,
        );
    });

    it('detects deprecated LTC address starting with "3"', () => {
        expect(
            isAddressDeprecated({
                addressValidator,
                address: '3NP9U8dbNzBcwhChpX8nk4F3Bf2oSucXj1',
                symbol: 'ltc',
            }),
        ).toBe('LTC_ADDRESS_INFO_URL');
    });

    it('returns undefined for non-deprecated BCH address', () => {
        expect(isAddressDeprecated({ addressValidator, address: '1notValid', symbol: 'bch' })).toBe(
            undefined,
        );
    });

    it('detects deprecated BCH address starting with "1"', () => {
        expect(
            isAddressDeprecated({
                addressValidator,
                address: '12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y',
                symbol: 'bch',
            }),
        ).toBe('HELP_CENTER_CASHADDR_URL');
    });
});
