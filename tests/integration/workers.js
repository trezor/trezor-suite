/* @flow */

import TinyWorker from 'tiny-worker';
import BlockchainLink from '../../build/lib';

describe('Worker', () => {
    let blockchain;

    beforeEach(async () => {
        // $FlowIssue
        blockchain = new BlockchainLink({
            name: 'Tests:Blockbook',
            worker: null,
            server: ['does-not-matter'],
            debug: false,
        });
    });

    afterEach(() => {
        blockchain.dispose();
    });

    it('Worker error (invalid worker path)', async () => {
        try {
            blockchain.settings.worker = 'foo.bar';
            const result = await blockchain.connect();
            expect(result).toBe(true);
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_not_found');
            expect(error.message).toBe('Worker not found');
        }
    });

    it('Worker error (invalid worker factory)', async () => {
        try {
            blockchain.settings.worker = () => {
                return 1;
            };
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_invalid');
            expect(error.message).toBe('Invalid worker object');
        }
    });

    // it('Worker error (handshake timeout)', async () => {
    //     console.info('Worker timeout - this test takes 30 sec.');
    //     try {
    //         blockchain.settings.worker = () => {
    //             return {
    //                 postMessage: () => {},
    //             };
    //         };
    //         await blockchain.connect();
    //     } catch (error) {
    //         expect(error.code).toBe('blockchain_link/worker_timeout');
    //         expect(error.message).toBe('Worker timeout');
    //     }
    // }).timeout(35000);

    it('Worker error (runtime)', async () => {
        try {
            blockchain.settings.worker = () => {
                if (typeof Worker !== 'undefined') {
                    const js =
                        'self.onmessage=function(){var r=1/x;};self.postMessage({type:"m_handshake"});';
                    const blob = new Blob([js], {
                        type: 'application/javascript',
                    });
                    return new Worker(URL.createObjectURL(blob));
                }
                return new TinyWorker(() => {
                    /* eslint-disable */
                    self.onmessage = () => {
                        // $FlowIssue: this will cause an runtime error
                        const r = 1 / x;
                    };
                    self.postMessage({ type: 'm_handshake' });
                    /* eslint-enable */
                });
            };
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_runtime');
        }
    });
});
