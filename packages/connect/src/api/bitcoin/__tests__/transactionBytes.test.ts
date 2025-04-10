import { networks } from '@trezor/utxo-lib';

import fixtures from '../__fixtures__/signtxVerify';
import { getTransactionVbytes } from '../transactionBytes';

describe('helpers/transactionBytes', () => {
    fixtures
        .filter(f => !f.error)
        .forEach(f => {
            it(f.description, () => {
                const coinInfo = {
                    // @ts-expect-error keyof networks
                    network: f.network ? networks[f.network] : networks.bitcoin,
                };
                // @ts-expect-error partial params
                const bytes = getTransactionVbytes(f.inputs, f.outputs, coinInfo);
                expect(bytes).toEqual(f.vbytes);
            });
        });
});
