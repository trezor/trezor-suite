import * as validation from './validation';

describe('Validation', () => {
    it('isPrimitive', () => {
        expect(validation.isPrimitive('string', 'foo')).toBe(true);
        expect(validation.isPrimitive(['string', true], undefined)).toBe(true);

        expect(validation.isPrimitive('string', 1)).toBe(false);
        expect(validation.isPrimitive(['string', true], 1)).toBe(false);
    });

    it('isObject', () => {
        expect(validation.isObject({ foo: 'string' }, { foo: 'value' })).toBe(true);
        // optional
        expect(validation.isObject({ foo: ['string', true] }, {})).toBe(true);
        // all-optional shape accepts a partial payload carrying only one field (e.g. the bridge
        // change-settings payload sending just usbImplementation without doNotStartOnStartup)
        expect(
            validation.isObject(
                { foo: ['boolean', true], bar: ['string', true] },
                { bar: 'value' },
            ),
        ).toBe(true);

        expect(validation.isObject({ foo: 'string' }, {})).toBe(false);
        expect(validation.isObject({ foo: 'string' }, null)).toBe(false);
    });

    it('isValidChannel', () => {
        expect(validation.isValidChannel('foo')).toBe(false);
        expect(validation.isValidChannel('handshake/event')).toBe(true);
    });
});
