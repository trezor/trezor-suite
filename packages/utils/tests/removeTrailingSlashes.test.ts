import { removeTrailingSlashes } from '../src/removeTrailingSlashes'; // Adjust path as needed

describe('removeTrailingSlashes', () => {
    it('should remove multiple trailing slashes', () => {
        expect(removeTrailingSlashes('path/to/something///')).toEqual('path/to/something');
    });

    it('should return the same string if there are no trailing slashes', () => {
        expect(removeTrailingSlashes('path/to/something')).toEqual('path/to/something');
    });

    it('should return an empty string for an already empty string input', () => {
        expect(removeTrailingSlashes('')).toEqual('');
    });

    it('should return an empty string for a null or undefined input', () => {
        expect(removeTrailingSlashes(null)).toEqual('');
        expect(removeTrailingSlashes(undefined)).toEqual('');
    });

    it('should not remove slashes from the middle of the string', () => {
        expect(removeTrailingSlashes('path/to//something')).toEqual('path/to//something');
    });

    it('should handle a url-like string with trailing slashes', () => {
        expect(removeTrailingSlashes('http://example.com/api/v1//')).toEqual(
            'http://example.com/api/v1',
        );
    });

    it('should handle a url-like string without trailing slashes', () => {
        expect(removeTrailingSlashes('http://example.com/api/v1')).toEqual(
            'http://example.com/api/v1',
        );
    });
});
