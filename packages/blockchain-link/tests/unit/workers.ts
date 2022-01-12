/* eslint-disable max-classes-per-file */
import * as TinyWorker from 'tiny-worker';
import BlockchainLink from '../../src';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            Worker: any;
        }
    }
}

describe('Worker', () => {
    let blockchain: BlockchainLink;

    beforeEach(() => {
        blockchain = new BlockchainLink({
            name: 'Tests:Blockbook',
            worker: () => {},
            server: ['does-not-matter'],
            debug: false,
        });
    });

    afterEach(() => {
        blockchain.dispose();
    });

    it('Mocked window.Worker (post unknown dfd and handshake messages, then successfully connect)', async () => {
        if (typeof Worker === 'undefined') {
            global.Worker = class MockWorker {
                constructor() {
                    setTimeout(() => {
                        this.onmessage({ data: { type: 'm_handshake_invalid' } });
                        this.onmessage({ data: { type: 'm_handshake' } });
                    }, 100);
                }
                onmessage(_data: any) {}
                postMessage(data: any) {
                    if (data.type === 'm_connect') {
                        this.onmessage({ data2: { id: 100, type: 'not-found' } });
                        this.onmessage({ data: { id: 100, type: 'not-found' } });
                        this.onmessage({ data: { id: 0, type: 'r_connect', payload: true } });
                    }
                }
                terminate() {
                    global.Worker = undefined;
                }
            };
        }

        blockchain.settings.worker = 'foo.bar';
        const result = await blockchain.connect();
        expect(result).toBe(true);
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

    it('Worker error (worker factory returns something different than Worker)', async () => {
        try {
            blockchain.settings.worker = () => 1;
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_invalid');
            expect(error.message).toBe('Invalid worker object');
        }
    });

    it('Worker error (worker factory returns nothing)', async () => {
        try {
            blockchain.settings.worker = () => {};
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_invalid');
            expect(error.message).toBe('Invalid worker object');
        }
    });

    it('Worker error (handshake timeout)', async () => {
        try {
            blockchain.settings.timeout = 2500;
            blockchain.settings.worker = () => ({
                postMessage: () => {},
            });
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_timeout');
            expect(error.message).toBe('Worker timeout');
        }
    });

    it('Worker error (runtime before handshake)', async () => {
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
                    setTimeout(() => {
                        // @ts-expect-error self is not typed
                        // eslint-disable-next-line no-restricted-globals
                        self.onerror(new Error('runtime error'));
                    }, 1000);
                });
            };
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_runtime');
        }
    });

    it('Mocked window.Worker (runtime error BEFORE handshake and error without message)', async () => {
        if (typeof Worker === 'undefined') {
            global.Worker = class MockWorker {
                constructor() {
                    setTimeout(() => this.onerror('string error'), 100);
                }
                onerror(_data: any) {}
                postMessage() {}
                terminate() {
                    global.Worker = undefined;
                }
            };
        }
        try {
            blockchain.settings.worker = 'foo.bar';
            await blockchain.connect();
        } catch (error) {
            global.Worker = undefined;
            expect(error.code).toBe('blockchain_link/worker_runtime');
        }
    });

    it('Worker error (runtime after handshake)', async () => {
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
                    // eslint-disable-next-line no-restricted-globals
                    self.onmessage = () => {
                        // @ts-expect-error undefined "x"
                        const r = 1 / x;
                    };
                    // eslint-disable-next-line no-restricted-globals
                    self.postMessage({ type: 'm_handshake' });
                });
            };
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_runtime');
        }
    });

    it('Mocked window.Worker (runtime error AFTER handshake and error without message)', async () => {
        if (typeof Worker === 'undefined') {
            global.Worker = class MockWorker {
                constructor() {
                    setTimeout(() => this.onmessage({ data: { type: 'm_handshake' } }), 100);
                }
                onerror(_data: any) {}
                onmessage(_data: any) {}
                postMessage() {
                    setTimeout(() => this.onerror('string error'), 100);
                }
                terminate() {
                    global.Worker = undefined;
                }
            };
        }
        try {
            blockchain.settings.worker = 'foo.bar';
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_runtime');
        }
    });
});
