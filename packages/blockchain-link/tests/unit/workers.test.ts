import TinyWorker from 'tiny-worker';
import BlockchainLink from '../../src';

class BaseMockWorker {
    onmessage(_data: any) {}
    postMessage(_data: any) {}
    terminate() {
        // @ts-expect-error
        global.Worker = undefined;
    }
    onmessageerror() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
        return true;
    }
    onerror(_data: any) {}
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
            global.Worker = class MockWorker extends BaseMockWorker {
                constructor() {
                    super();
                    setTimeout(() => {
                        this.onmessage({ data: { type: 'm_handshake_invalid' } });
                        this.onmessage({ data: { type: 'm_handshake' } });
                    }, 100);
                }
                postMessage(data: any) {
                    if (data.type === 'm_connect') {
                        this.onmessage({ data2: { id: 100, type: 'not-found' } });
                        this.onmessage({ data: { id: 100, type: 'not-found' } });
                        this.onmessage({ data: { id: 0, type: 'r_connect', payload: true } });
                    }
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
            await blockchain.connect();
            fail('Did not throw');
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_not_found');
            expect(error.message).toBe('Worker not found');
        }
    });

    it('Worker error (worker factory returns something different than Worker)', async () => {
        try {
            blockchain.settings.worker = () => 1;
            await blockchain.connect();
            fail('Did not throw');
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_invalid');
            expect(error.message).toBe('Invalid worker object');
        }
    });

    it('Worker error (worker factory returns nothing)', async () => {
        try {
            blockchain.settings.worker = () => {};
            await blockchain.connect();
            fail('Did not throw');
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_invalid');
            expect(error.message).toBe('Invalid worker object');
        }
    });

    it('Worker error (handshake timeout)', async () => {
        try {
            blockchain.settings.timeout = 200;
            blockchain.settings.worker = () => ({ postMessage: () => {} });
            await blockchain.connect();
            fail('Did not throw');
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

                        self.onerror(new Error('runtime error'));
                    }, 100);
                });
            };
            await blockchain.connect();
            fail('Did not throw');
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_runtime');
        }
    });

    it('Mocked window.Worker (runtime error BEFORE handshake and error without message)', async () => {
        if (typeof Worker === 'undefined') {
            global.Worker = class MockWorker extends BaseMockWorker {
                constructor() {
                    super();
                    setTimeout(() => this.onerror('string error'), 100);
                }
            };
        }
        try {
            blockchain.settings.worker = 'foo.bar';
            await blockchain.connect();
            fail('Did not throw');
        } catch (error) {
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
                    self.onmessage = () => {
                        // @ts-expect-error undefined "x"
                        const r = 1 / x;
                    };

                    self.postMessage({ type: 'm_handshake' });
                });
            };
            await blockchain.connect();
            fail('Did not throw');
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_runtime');
        }
    });

    it('Mocked window.Worker (runtime error AFTER handshake and error without message)', async () => {
        if (typeof Worker === 'undefined') {
            global.Worker = class MockWorker extends BaseMockWorker {
                constructor() {
                    super();
                    setTimeout(() => this.onmessage({ data: { type: 'm_handshake' } }), 100);
                }
                postMessage() {
                    setTimeout(() => this.onerror('string error'), 100);
                }
            };
        }
        try {
            blockchain.settings.worker = 'foo.bar';
            await blockchain.connect();
            fail('Did not throw');
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_runtime');
        }
    });
});
