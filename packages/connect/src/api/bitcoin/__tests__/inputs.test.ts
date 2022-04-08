import { networks } from '@trezor/utxo-lib';
import { validateTrezorInputs } from '../inputs';
import * as fixtures from '../__fixtures__/inputs';

describe('core/methods/tx/inputs', () => {
    describe('validateTrezorInputs', () => {
        const coinInfo: any = { network: networks.bitcoin };
        fixtures.validateTrezorInputs.forEach(f => {
            it(f.description, () => {
                if (f.result) {
                    expect(validateTrezorInputs(f.params as any, coinInfo)).toMatchObject(f.result);
                } else {
                    expect(() => validateTrezorInputs(f.params as any, coinInfo)).toThrow();
                }
            });
        });
    });
});
