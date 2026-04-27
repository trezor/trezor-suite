import { getBitcoinNetwork } from '../../data/coinInfo';
import * as fixtures from '../__fixtures__/addressUtils';
import * as utils from '../addressUtils';

describe('utils/addressUtils', () => {
    describe('isValidAddress', () => {
        fixtures.validAddresses.forEach(f => {
            it(`${f.description} ${f.address}`, () => {
                expect(utils.isValidAddress(f.address, getBitcoinNetwork(f.coin)!)).toEqual(true);
            });
        });

        fixtures.invalidAddresses.forEach(f => {
            it(`Invalid ${f.coin} ${f.address}`, () => {
                expect(utils.isValidAddress(f.address, getBitcoinNetwork(f.coin)!)).toEqual(false);
            });
        });
    });
});
