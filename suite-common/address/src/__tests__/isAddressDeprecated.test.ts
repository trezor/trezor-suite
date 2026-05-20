import { isAddressDeprecated } from '../isAddressDeprecated';

// https://litecoin-project.github.io/p2sh-convert/
// https://cashaddr.bitcoincash.org/
describe('isAddressDeprecated', () => {
    it('returns undefined for non-deprecated LTC address', () => {
        expect(isAddressDeprecated('3notValid', 'ltc')).toBe(undefined);
    });

    it('detects deprecated LTC address starting with "3"', () => {
        expect(isAddressDeprecated('3NP9U8dbNzBcwhChpX8nk4F3Bf2oSucXj1', 'ltc')).toBe(
            'LTC_ADDRESS_INFO_URL',
        );
    });

    it('returns undefined for non-deprecated BCH address', () => {
        expect(isAddressDeprecated('1notValid', 'bch')).toBe(undefined);
    });

    it('detects deprecated BCH address starting with "1"', () => {
        expect(isAddressDeprecated('12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', 'bch')).toBe(
            'HELP_CENTER_CASHADDR_URL',
        );
    });
});
