import { promiseAllSequence } from '@trezor/utils';
import { networks } from '@trezor/utxo-lib';

import fixtures from './__fixtures__/signtxVerify';
import { deriveOutputScript, verifyTx } from './signtxVerify';

describe('helpers/signtxVerify', () => {
    fixtures.forEach(({ description, network, inputs, outputs, tx, error, getHDNode }) => {
        it(description, async () => {
            const coinInfo = {
                // @ts-expect-error keyof networks
                network: network ? networks[network] : networks.bitcoin,
            };

            const call = async () =>
                verifyTx(tx, {
                    inputs,
                    // @ts-expect-error
                    outputs,
                    outputScripts: await promiseAllSequence(
                        outputs.map(
                            output => () =>
                                deriveOutputScript(
                                    // @ts-expect-error
                                    getHDNode || (() => Promise.resolve({ xpub: '' })),
                                    output,
                                    coinInfo.network,
                                ),
                        ),
                    ),
                    network: coinInfo.network,
                });

            if (error) {
                await expect(call()).rejects.toThrow(error);
            } else {
                await expect(call()).resolves.not.toThrow();
            }
        });
    });
});
