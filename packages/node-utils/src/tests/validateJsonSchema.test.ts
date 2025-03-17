import { validateJsonSchema } from '../validateJsonSchema';

describe('validateJsonSchema', () => {
    const mockConfig = JSON.stringify({ key: 'value' });
    const mockSchema = JSON.stringify({
        type: 'object',
        properties: {
            key: { type: 'string' },
        },
        required: ['key'],
    });

    it('should validate a correct config against the schema', () => {
        expect(() => validateJsonSchema(mockConfig, mockSchema)).not.toThrow();
    });

    it('should throw an error for an invalid config', () => {
        const invalidConfig = JSON.stringify({ key: 123 });

        expect(() => validateJsonSchema(invalidConfig, mockSchema)).toThrow(
            'Config is invalid: [{"instancePath":"/key","schemaPath":"#/properties/key/type","keyword":"type","params":{"type":"string"},"message":"must be string"}]',
        );
    });
});
