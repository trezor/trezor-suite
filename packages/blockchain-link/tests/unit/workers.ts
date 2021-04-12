// @ts-ignore tiny-worker types
import TinyWorker from 'tiny-worker';
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
            global.Worker = () => {
                const W = {
                    onmessage: (_data: any) => {},
                    postMessage: (data: any) => {
                        if (data.type === 'm_connect') {
                            W.onmessage({ data2: { id: 100, type: 'not-found' } });
                            W.onmessage({ data: { id: 100, type: 'not-found' } });
                            W.onmessage({ data: { id: 0, type: 'r_connect', payload: true } });
                        }
                    },
                    terminate: () => {
                        global.Worker = undefined;
                    },
                };
                setTimeout(() => {
                    W.onmessage({ data: { type: 'm_handshake_invalid' } });
                    W.onmessage({ data: { type: 'm_handshake' } });
                }, 100);
                return W;
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
                    /* eslint-disable */
                    setTimeout(() => {
                        // @ts-ignore
                        self.onerror(new Error('runtime error'));
                    }, 1000)
                    /* eslint-enable */
                });
            };
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_runtime');
        }
    });

    it('Mocked window.Worker (runtime error BEFORE handshake and error without message)', async () => {
        if (typeof Worker === 'undefined') {
            global.Worker = () => {
                const W = {
                    postMessage: () => {},
                    onerror: (_e: any) => {},
                };
                setTimeout(() => {
                    W.onerror('string error');
                }, 100);
                return W;
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
                    /* eslint-disable */
                    self.onmessage = () => {
                        // @ts-ignore undefined "x"
                        const r = 1 / x;
                    };
                    // @ts-ignore postMessage params length
                    self.postMessage({ type: 'm_handshake' });
                    /* eslint-enable */
                });
            };
            await blockchain.connect();
        } catch (error) {
            expect(error.code).toBe('blockchain_link/worker_runtime');
        }
    });

    it('Mocked window.Worker (runtime error AFTER handshake and error without message)', async () => {
        if (typeof Worker === 'undefined') {
            global.Worker = () => {
                const W = {
                    onerror: (_e: any) => {},
                    onmessage: (_data: any) => {},
                    postMessage: () => {
                        setTimeout(() => {
                            W.onerror('string error');
                        }, 100);
                    },
                    terminate: () => {
                        global.Worker = undefined;
                    },
                };
                setTimeout(() => {
                    W.onmessage({ data: { type: 'm_handshake' } });
                }, 100);
                return W;
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
