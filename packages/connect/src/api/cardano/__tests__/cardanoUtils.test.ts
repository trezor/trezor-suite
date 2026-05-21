import * as fixtures from '../__fixtures__/cardanoUtils';
import { getTtl, prepareCertificates, transformUtxos } from '../cardanoUtils';

describe('cardano utils', () => {
    let dateSpy: any;
    beforeAll(() => {
        dateSpy = jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1653394389512);
    });

    afterAll(() => {
        dateSpy.mockRestore();
    });

    fixtures.transformUtxos.forEach(f => {
        it(`transformUtxos: ${f.description}`, () => {
            expect(transformUtxos(f.utxo)).toMatchObject(f.result);
        });
    });

    fixtures.prepareCertificates.forEach(f => {
        it(`prepareCertificates: ${f.description}`, () => {
            expect(prepareCertificates(f.certificates)).toMatchObject(f.result);
        });
    });

    it(`getTTL`, () => {
        expect(getTtl(true)).toBe(-13254411);
    });
});
