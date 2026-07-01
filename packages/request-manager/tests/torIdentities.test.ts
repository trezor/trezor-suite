import { Socks5ProxyAgent } from 'undici';

import { TorIdentities } from '../src/torIdentities';

// The undici Socks5ProxyAgent is stubbed so this runs as a pure unit test (no Tor, no network): each
// constructed "dispatcher" just records the SOCKS proxy URL it was built from, which is where the Tor
// identity is encoded (username/password -> Tor IsolateSOCKSAuth -> one circuit per identity).
jest.mock('undici', () => ({
    Socks5ProxyAgent: jest.fn((proxyUrl: URL) => ({ proxyUrl, destroy: jest.fn() })),
}));

const Socks5Mock = Socks5ProxyAgent as unknown as jest.Mock;

const getTorSettings = () => ({ running: true, host: '127.0.0.1', port: 9050 });

// the URL passed to the Nth Socks5ProxyAgent construction
const proxyUrlOf = (call: number): URL => Socks5Mock.mock.calls[call][0];

describe('TorIdentities.getDispatcher', () => {
    beforeEach(() => Socks5Mock.mockClear());

    it('encodes distinct identities as distinct SOCKS credentials (distinct circuits)', () => {
        const tor = new TorIdentities(getTorSettings);
        const alice = tor.getDispatcher('alice');
        const bob = tor.getDispatcher('bob');

        expect(alice).not.toBe(bob);
        expect(Socks5Mock).toHaveBeenCalledTimes(2);
        expect(proxyUrlOf(0).username).toBe('alice');
        expect(proxyUrlOf(1).username).toBe('bob');
        expect(proxyUrlOf(0).username).not.toBe(proxyUrlOf(1).username);
    });

    it('caches the dispatcher for a stable identity (same circuit reused)', () => {
        const tor = new TorIdentities(getTorSettings);
        const first = tor.getDispatcher('alice');
        const second = tor.getDispatcher('alice');

        expect(first).toBe(second);
        expect(Socks5Mock).toHaveBeenCalledTimes(1);
    });

    it('falls back to the user as password for a bare identity (undici requires a password)', () => {
        const tor = new TorIdentities(getTorSettings);
        tor.getDispatcher('alice');

        expect(proxyUrlOf(0).username).toBe('alice');
        expect(proxyUrlOf(0).password).toBe('alice');
    });

    it('resets the circuit on a password change: tears down and recreates the dispatcher', () => {
        const tor = new TorIdentities(getTorSettings);
        const before = tor.getDispatcher('alice') as unknown as { destroy: jest.Mock };
        const after = tor.getDispatcher('alice:fresh-password');

        expect(after).not.toBe(before);
        expect(before.destroy).toHaveBeenCalledTimes(1); // old circuit torn down
        expect(Socks5Mock).toHaveBeenCalledTimes(2);
        expect(proxyUrlOf(1).username).toBe('alice');
        expect(proxyUrlOf(1).password).toBe('fresh-password');
    });
});
