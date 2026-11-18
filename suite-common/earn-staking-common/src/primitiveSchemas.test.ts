import { firmwareVersionSchema } from './primitiveSchemas';

describe('firmwareVersionSchema', () => {
    it.each(['2.12.2', '0.0.0', '10.3.14'])('parses %s', version => {
        expect(firmwareVersionSchema.parse(version)).toBe(version);
    });

    it.each(['2.12', '2.12.2.1', '2.12.2-beta', 'v2.12.2', '2.12.2 ', ''])(
        'rejects %p',
        version => {
            expect(firmwareVersionSchema.safeParse(version).success).toBe(false);
        },
    );
});
