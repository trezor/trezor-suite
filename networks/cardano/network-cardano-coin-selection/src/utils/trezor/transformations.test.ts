import * as utils from './transformations';
import * as fixtures from '../../../mocks/mockTransformations';
import { type FinalOutput } from '../../types/types';

describe('trezor transformation utils', () => {
    fixtures.transformToTrezorOutputs.forEach(f => {
        test(f.description, () => {
            expect(
                utils.transformToTrezorOutputs(
                    f.outputs as FinalOutput[],
                    f.changeAddressParameters,
                ),
            ).toMatchObject(f.result);
        });
    });

    fixtures.drepIdToHex.forEach(f => {
        test(f.description, () => {
            expect(utils.drepIdToHex(f.drepId)).toStrictEqual(f.result);
        });
    });
});
