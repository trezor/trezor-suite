import { createChangeSuiteSyncServerSchema } from './relayServerSettings';

const schema = createChangeSuiteSyncServerSchema({
    requiredTranslation: 'REQUIRED',
    invalidUrlTranslation: 'INVALID_URL',
});

const getFirstError = (values: unknown) => schema.safeParse(values).error?.issues[0];

describe(createChangeSuiteSyncServerSchema.name, () => {
    it('accepts the default server with any custom URL', () => {
        expect(schema.parse({ server: 'default', customRelayUrl: null })).toEqual({
            server: 'default',
            customRelayUrl: null,
        });
        expect(schema.parse({ server: 'default', customRelayUrl: 'not a url' })).toEqual({
            server: 'default',
            customRelayUrl: 'not a url',
        });
    });

    it('rejects a long invalid URL quickly', () => {
        const start = Date.now();

        expect(
            getFirstError({ server: 'custom', customRelayUrl: `//${'0.0.'.repeat(40)}!` })?.message,
        ).toBe('INVALID_URL');
        expect(Date.now() - start).toBeLessThan(1000);
    });

    it('requires a URL for a custom server', () => {
        expect(getFirstError({ server: 'custom', customRelayUrl: null })).toMatchObject({
            path: ['customRelayUrl'],
            message: 'REQUIRED',
        });
        expect(getFirstError({ server: 'custom', customRelayUrl: '' })).toMatchObject({
            path: ['customRelayUrl'],
            message: 'REQUIRED',
        });
    });

    it.each([
        'https://suite-sync.trezor.io/evolu/',
        'http://127.0.0.1:4000/evolu/',
        'http://localhost:4000',
        'https://my-custom-relay.example.com',
        'http://suite-sync.example.onion/evolu/',
    ])('accepts the custom URL %s', customRelayUrl => {
        expect(schema.safeParse({ server: 'custom', customRelayUrl }).success).toBe(true);
    });

    it.each([
        'suite-sync.trezor.io',
        'ftp://suite-sync.trezor.io',
        '//suite-sync.trezor.io/evolu/',
        ' https://suite-sync.trezor.io/evolu/',
        'https://exa mple.com',
    ])('rejects the custom URL "%s"', customRelayUrl => {
        expect(getFirstError({ server: 'custom', customRelayUrl })).toMatchObject({
            path: ['customRelayUrl'],
            message: 'INVALID_URL',
        });
    });

    it('rejects an unknown server type', () => {
        expect(getFirstError({ server: 'other', customRelayUrl: null })?.path).toEqual(['server']);
    });
});
