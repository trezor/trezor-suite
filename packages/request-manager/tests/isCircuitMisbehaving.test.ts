import { CircuitMisbehavingError, isCircuitMisbehaving } from '../src/isCircuitMisbehaving';

describe('isCircuitMisbehaving', () => {
    it('returns true for ECONNRESET error', () => {
        const error = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true for UND_ERR_SOCKET error (undici)', () => {
        const error = Object.assign(new Error('other side closed'), { code: 'UND_ERR_SOCKET' });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true for ETIMEDOUT error', () => {
        const error = Object.assign(new Error('connect ETIMEDOUT'), { code: 'ETIMEDOUT' });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true for SocksClientError (has options field)', () => {
        const error = Object.assign(new Error('Socks5 proxy rejected connection'), {
            options: { proxy: { host: '127.0.0.1', port: 9050 } },
        });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true for socks system error with "Socks5" in message', () => {
        const error = Object.assign(new Error('Socks5 proxy rejected connection'), {
            type: 'system',
        });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true for socks system error with "Proxy" in message', () => {
        const error = Object.assign(new Error('Proxy connection timed out'), {
            type: 'system',
        });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true for socks system error with lowercase "socks" in message', () => {
        const error = Object.assign(new Error('socks connection refused'), {
            type: 'system',
        });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true for socks system error with lowercase "proxy" in message', () => {
        const error = Object.assign(new Error('proxy connection timed out'), {
            type: 'system',
        });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true when cause has ECONNRESET (undici wrapping)', () => {
        const cause = Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' });
        const error = Object.assign(new TypeError('fetch failed'), { cause });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true when cause has UND_ERR_SOCKET', () => {
        const cause = Object.assign(new Error('other side closed'), { code: 'UND_ERR_SOCKET' });
        const error = Object.assign(new TypeError('fetch failed'), { cause });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true when cause has options field (SocksClientError wrapped)', () => {
        const cause = Object.assign(new Error('Connection failed'), {
            options: { proxy: {} },
        });
        const error = Object.assign(new TypeError('fetch failed'), { cause });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns true when cause is a socks system error', () => {
        const cause = Object.assign(new Error('Socks5 proxy rejected connection'), {
            type: 'system',
        });
        const error = Object.assign(new TypeError('fetch failed'), { cause });
        expect(isCircuitMisbehaving(error)).toBe(true);
    });

    it('returns false for ECONNREFUSED error', () => {
        const error = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
        expect(isCircuitMisbehaving(error)).toBe(false);
    });

    it('returns false for generic Error without relevant fields', () => {
        const error = new Error('something went wrong');
        expect(isCircuitMisbehaving(error)).toBe(false);
    });

    it('returns false for null', () => {
        expect(isCircuitMisbehaving(null)).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isCircuitMisbehaving(undefined)).toBe(false);
    });

    it('returns false for a string', () => {
        expect(isCircuitMisbehaving('ECONNRESET')).toBe(false);
    });

    it('returns false for system error without socks keywords in message', () => {
        const error = Object.assign(new Error('ETIMEDOUT'), { type: 'system' });
        expect(isCircuitMisbehaving(error)).toBe(false);
    });

    it('returns false when cause is not a circuit error', () => {
        const cause = Object.assign(new Error('ECONNREFUSED'), { code: 'ECONNREFUSED' });
        const error = Object.assign(new TypeError('fetch failed'), { cause });
        expect(isCircuitMisbehaving(error)).toBe(false);
    });

    it('returns false when cause is null', () => {
        const error = Object.assign(new TypeError('fetch failed'), { cause: null });
        expect(isCircuitMisbehaving(error)).toBe(false);
    });
});

describe('CircuitMisbehavingError', () => {
    it('has correct name, message and properties', () => {
        const cause = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
        const error = new CircuitMisbehavingError(
            { host: 'example.onion', identity: 'coinjoin-1', method: 'fetch' },
            cause,
        );

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(CircuitMisbehavingError);
        expect(error.name).toBe('CircuitMisbehavingError');
        expect(error.host).toBe('example.onion');
        expect(error.identity).toBe('coinjoin-1');
        expect(error.method).toBe('fetch');
        expect(error.cause).toBe(cause);
        expect(error.message).toBe('CIRCUIT_MISBEHAVING');
    });

    it('handles missing identity', () => {
        const cause = new Error('timeout');
        const error = new CircuitMisbehavingError(
            { host: 'blockstream.info', method: 'http' },
            cause,
        );

        expect(error.identity).toBeUndefined();
        expect(error.message).toBe('CIRCUIT_MISBEHAVING');
    });

    it('can be caught with instanceof', () => {
        const cause = new Error('ECONNRESET');
        const error = new CircuitMisbehavingError(
            { host: 'coordinator.onion', identity: 'default', method: 'fetch' },
            cause,
        );

        expect(() => {
            throw error;
        }).toThrow(CircuitMisbehavingError);
    });
});
