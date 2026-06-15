import { createTransportList } from '../TransportList';

const { createTestTransport } = global.JestMocks;

describe('createTransportList', () => {
    it('returns [] when transports is undefined', () => {
        expect(createTransportList([], undefined)).toEqual([]);
    });

    it('returns [] when transports is empty', () => {
        expect(createTransportList([], [])).toEqual([]);
    });

    it('passes a pre-built Transport instance through', () => {
        const instance = createTestTransport();
        expect(createTransportList([], [instance])).toEqual([instance]);
    });

    it('reuses an existing transport with matching name', () => {
        const existing = createTestTransport();
        const candidate = createTestTransport();
        const [transport] = createTransportList([existing], [candidate]);
        expect(transport).toBe(existing);
        expect(transport).not.toBe(candidate);
    });

    it('resolves multiple entries in order', () => {
        const a = createTestTransport();
        const b = createTestTransport();
        // distinct names so dedupe-by-name keeps both
        b.name = 'TestTransportB';
        const result = createTransportList([], [a, b]);
        expect(result).toEqual([a, b]);
    });

    it('throws on a string transport identifier', () => {
        // @ts-expect-error - strings are not part of the public surface
        expect(() => createTransportList([], ['BridgeTransport'])).toThrow(
            'init({ transports }) entry is not a valid Transport instance',
        );
    });

    it('throws on a non-Transport object', () => {
        // @ts-expect-error - plain object is not a Transport
        expect(() => createTransportList([], [{}])).toThrow(
            'init({ transports }) entry is not a valid Transport instance',
        );
    });

    it('throws on a transport class (pure DI accepts instances only)', () => {
        class Bogus {
            name = 'Bogus';
        }
        // @ts-expect-error - a class is not a constructed Transport instance
        expect(() => createTransportList([], [Bogus])).toThrow(
            'init({ transports }) entry is not a valid Transport instance',
        );
    });
});
