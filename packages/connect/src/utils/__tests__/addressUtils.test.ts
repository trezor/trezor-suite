import coinsJSON from '@trezor/connect-common/files/coins.json';
import { parseCoinsJson, getBitcoinNetwork } from '../../data/coinInfo';
import * as utils from '../addressUtils';
import * as fixtures from '../__fixtures__/addressUtils';

describe('utils/addressUtils', () => {
    beforeAll(() => {
        // load coin definitions
        parseCoinsJson(coinsJSON);
    });

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
