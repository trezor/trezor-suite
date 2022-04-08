import { networks } from '@trezor/utxo-lib';
import { verifyTx } from '../signtxVerify';
import fixtures from '../__fixtures__/signtxVerify';

const getHDNode = () => ({
    xpub: '',
});

describe('helpers/signtxVerify', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            const coinInfo = {
                // @ts-expect-error keyof networks
                network: f.network ? networks[f.network] : networks.bitcoin,
            };
            const call = () =>
                // @ts-expect-error partial params
                verifyTx(f.getHDNode || getHDNode, f.inputs, f.outputs, f.tx, coinInfo);
            if (f.error) {
                await expect(call()).rejects.toThrow(f.error);
            } else {
                await expect(call()).resolves.not.toThrow();
            }
        });
    });
});
