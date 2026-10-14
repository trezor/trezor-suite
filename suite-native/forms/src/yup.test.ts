import { type StringSchema } from 'yup';

import { isTranslationKey } from '@suite-native/intl';

import { yup } from './yup';

describe('yup localization', () => {
    const validateSchema = async (schema: StringSchema, value: string) => {
        try {
            await schema.validate(value);
        } catch (error) {
            return error;
        }
    };

    it('emits a translatable key for a bare required()', async () => {
        const error = await validateSchema(yup.string().required(), '');

        expect(error.message).toBe('forms.errors.mixed.required');
        expect(isTranslationKey(error.message)).toBe(true);
    });

    it('emits a translatable key for a bare max()', async () => {
        const error = await validateSchema(yup.string().max(3), 'abcd');

        expect(error.message).toBe('forms.errors.string.max');
        expect(isTranslationKey(error.message)).toBe(true);
    });

    it('leaves an explicit message untouched', async () => {
        const error = await validateSchema(yup.string().required('Empty pin.'), '');

        expect(error.message).toBe('Empty pin.');
        expect(isTranslationKey(error.message)).toBe(false);
    });
});
