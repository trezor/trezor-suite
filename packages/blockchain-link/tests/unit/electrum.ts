import fixtures from './fixtures/electrum';
import { deriveAddresses } from '../../src/workers/electrum/utils/derivation';

describe('Testing address derivation from xpubs', () => {
    fixtures.derivation.forEach(f => {
        it(f.description, () => {
            const { xpubs, change, receive, pathPrefix } = f;

            xpubs.forEach(xpub => {
                const rec = deriveAddresses(xpub, 'receive', 0, receive.length);
                expect(
                    receive.map((address, i) => ({
                        address,
                        path: `${pathPrefix}/0/${i}`,
                    }))
                ).toEqual(rec);

                const cng = deriveAddresses(xpub, 'change', 0, change.length);
                expect(
                    change.map((address, i) => ({
                        address,
                        path: `${pathPrefix}/1/${i}`,
                    }))
                ).toEqual(cng);
            });
        });
    });
});
