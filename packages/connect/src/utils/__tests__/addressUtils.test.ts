import type { CoinSymbol } from '@trezor/connect-common/src/types/coinInfo';

import { getBitcoinNetwork } from '../../data/coinInfo';
import * as fixtures from '../__fixtures__/addressUtils';
import * as utils from '../addressUtils';

describe('utils/addressUtils', () => {
    describe('isValidAddress', () => {
        fixtures.validAddresses.forEach(f => {
            it(`${f.description} ${f.address}`, () => {
                expect(
                    utils.isValidAddress(f.address, getBitcoinNetwork(f.coin as CoinSymbol)!),
                ).toEqual(true);
            });
        });

        fixtures.invalidAddresses.forEach(f => {
            it(`Invalid ${f.coin} ${f.address}`, () => {
                expect(
                    utils.isValidAddress(f.address, getBitcoinNetwork(f.coin as CoinSymbol)!),
                ).toEqual(false);
            });
        });
    });
});
