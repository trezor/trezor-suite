import coinsJSON from '@trezor/connect-common/files/coins.json';
import blockchainLinkJSON from '@trezor/connect-common/files/blockchain-link.json';

import { parseCoinsJson, getBitcoinNetwork } from '../../data/coinInfo';
import * as utils from '../addressUtils';
import * as fixtures from '../__fixtures__/addressUtils';

describe('utils/addressUtils', () => {
    beforeAll(() => {
        // load coin definitions
        parseCoinsJson(coinsJSON, blockchainLinkJSON);
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
