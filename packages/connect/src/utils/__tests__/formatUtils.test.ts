import { formatAmount } from '../formatUtils';

import * as fixtures from '../__fixtures__/formatUtils';

describe('utils/formatUtils', () => {
    describe('formatAmount', () => {
        fixtures.formatAmountFixtures.forEach(f => {
            it(f.description, () => {
                expect(formatAmount(...f.input)).toEqual(f.output);
            });
        });
    });

    // todo:
    describe.skip('btckb2satoshib', () => {});
    describe.skip('formatTime', () => {});
    describe.skip('hasHexPrefix', () => {});
    describe.skip('messageToHex', () => {});
    describe.skip('stripHexPrefix', () => {});
});
