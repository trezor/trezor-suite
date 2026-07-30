import { asCoinSymbol } from '@trezor/connect-common';

import * as fixtures from './__fixtures__/addressUtils';
import * as utils from './addressUtils';
import { getBitcoinNetwork } from '../data/coinInfo';

describe('utils/addressUtils', () => {
    describe('isValidAddress', () => {
        fixtures.validAddresses.forEach(f => {
            it(`${f.description} ${f.address}`, () => {
                expect(
                    utils.isValidAddress(f.address, getBitcoinNetwork(asCoinSymbol(f.coin))!),
                ).toEqual(true);
            });
        });

        fixtures.invalidAddresses.forEach(f => {
            it(`Invalid ${f.coin} ${f.address}`, () => {
                expect(
                    utils.isValidAddress(f.address, getBitcoinNetwork(asCoinSymbol(f.coin))!),
                ).toEqual(false);
            });
        });
    });
});
