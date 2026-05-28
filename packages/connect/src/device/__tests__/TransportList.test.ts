import { createTransportList } from '../TransportList';

const { createTestTransport, createTestTransportClass } = global.JestMocks;

const params = { id: 'test-id' };

describe('createTransportList', () => {
    const resolve = createTransportList(params);

    it('returns [] when transports is undefined', () => {
        expect(resolve([], undefined)).toEqual([]);
    });

    it('returns [] when transports is empty', () => {
        expect(resolve([], [])).toEqual([]);
    });

    it('passes a pre-built Transport instance through', () => {
        const instance = createTestTransport();
        expect(resolve([], [instance])).toEqual([instance]);
    });

    it('instantiates a TransportClass', () => {
        const TestClass = createTestTransportClass();
        const [transport] = resolve([], [TestClass]);
        expect(transport).toBeInstanceOf(TestClass);
    });

    it('reuses an existing transport with matching name (class arg)', () => {
        const existing = createTestTransport(); // name = 'TestTransport'
        const TestClass = createTestTransportClass();
        const [transport] = resolve([existing], [TestClass]);
        expect(transport).toBe(existing);
    });

    it('reuses an existing transport with matching name (instance arg)', () => {
        const existing = createTestTransport();
        const candidate = createTestTransport();
        const [transport] = resolve([existing], [candidate]);
        expect(transport).toBe(existing);
        expect(transport).not.toBe(candidate);
    });

    it('resolves multiple entries in order', () => {
        const instance = createTestTransport();
        const TestClass = createTestTransportClass();
        const result = resolve([], [instance, TestClass]);
        expect(result).toHaveLength(2);
        expect(result[0]).toBe(instance);
        expect(result[1]).toBeInstanceOf(TestClass);
    });

    it('throws on a string transport identifier', () => {
        // @ts-expect-error - strings are not part of the public surface
        expect(() => resolve([], ['BridgeTransport'])).toThrow(
            'init({ transports }) entry is not a Transport instance or class',
        );
    });

    it('throws on a non-Transport object', () => {
        // @ts-expect-error - plain object is not a Transport
        expect(() => resolve([], [{}])).toThrow(
            'init({ transports }) entry is not a valid Transport instance',
        );
    });

    it('throws when a class constructor produces a non-Transport', () => {
        class Bogus {
            name = 'Bogus';
        }
        // @ts-expect-error - class does not produce a Transport
        expect(() => resolve([], [Bogus])).toThrow(
            'Provided class did not produce a valid Transport instance',
        );
    });

    it('throws a controlled Runtime error for a non-constructable function (arrow)', () => {
        const arrow = () => ({ name: 'NotATransport' });
        // @ts-expect-error - arrow function is not a Transport class
        expect(() => resolve([], [arrow])).toThrow(
            'Provided value is not a constructable Transport class',
        );
    });

    it('propagates a real TypeError thrown inside a valid constructor', () => {
        class Exploding {
            constructor() {
                throw new TypeError('boom from constructor');
            }
        }
        // @ts-expect-error - class constructor throws
        expect(() => resolve([], [Exploding])).toThrow('boom from constructor');
    });
});
