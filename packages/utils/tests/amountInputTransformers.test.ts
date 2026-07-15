import { decimalTransformer, integerTransformer } from '../src/amountInputTransformers';

describe('decimalTransformer', () => {
    it.each([
        ['1.23', '1,23'],
        ['1', 'a1a'],
        ['0.1', '.1'],
        ['0.5', '..5'],
        ['1.', '1.'],
        ['', ''],
        ['1.11', '1.1.1'],
        ['1', '0001'],
        ['0', '0000'],
        ['0.00', '0.00'],
    ])('should return %s for %s input', (expectedValue, inputValue) => {
        expect(decimalTransformer(inputValue)).toEqual(expectedValue);
    });
});

describe('integerTransformer', () => {
    it.each([
        ['123', '1.23'],
        ['1', 'a1a'],
        ['1', '0001'],
        ['0', '0000'],
        ['0', '0.00'],
    ])('should return %s for %s input', (expectedValue, inputValue) => {
        expect(integerTransformer(inputValue)).toEqual(expectedValue);
    });
});
