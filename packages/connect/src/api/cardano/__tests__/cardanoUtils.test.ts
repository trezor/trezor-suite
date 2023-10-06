import { composeTxPlan, getTtl, transformUtxos, prepareCertificates } from '../cardanoUtils';
import * as fixtures from '../__fixtures__/cardanoUtils';

describe('cardano utils', () => {
    let dateSpy: any;
    beforeAll(() => {
        dateSpy = jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1653394389512);
    });

    afterAll(() => {
        dateSpy.mockRestore();
    });

    it('composeTxPlan', () => {
        expect(() =>
            composeTxPlan(
                'descriptor',
                [],
                [],
                [
                    {
                        type: 0,
                    },
                    {
                        path: 'path',
                        pool: 'abc',
                        type: 2,
                    },
                ],
                [{ amount: '10', stakeAddress: 'stkAddr' }],
                'addr',
                true,
            ),
        ).toThrow('UTxO balance insufficient'); // TODO add real test
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
