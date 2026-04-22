import { networks } from '@trezor/utxo-lib';

import * as fixtures from '../__fixtures__/outputs';
import { validateTrezorOutputs } from '../outputs';

describe('core/methods/tx/outputs', () => {
    describe('validateTrezorOutputs', () => {
        const coinInfo: any = { network: networks.bitcoin, label: 'Bitcoin' };
        fixtures.validateTrezorOutputs.forEach((f: any) => {
            it(f.description, () => {
                if (f.result) {
                    expect(validateTrezorOutputs(f.params, coinInfo)).toMatchObject(f.result);
                } else {
                    expect(() => validateTrezorOutputs(f.params, coinInfo)).toThrow(f.error);
                }
            });
        });
    });
});
