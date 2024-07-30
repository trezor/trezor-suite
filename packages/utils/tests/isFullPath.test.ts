import { isFullPath } from '../src/isFullPath';

describe('isFullPath', () => {
    it('should identify valid full paths', () => {
        // Unix-like full path with extension
        expect(isFullPath('/home/user/file.txt')).toBe(true);
        // Windows full path with extension
        expect(isFullPath('C:\\Users\\file.txt')).toBe(true);
        // Unix-like full path without extension
        expect(isFullPath('/home/user/directory')).toBe(true);
        // Windows full path without extension
        expect(isFullPath('C:\\Users\\directory')).toBe(true);
    });

    it('should not identify invalid or relative paths', () => {
        // Relative path
        expect(isFullPath('relative/path/to/file.js')).toBe(false);
        // Simple filename with extension
        expect(isFullPath('file.txt')).toBe(false);
        // Random string
        expect(isFullPath('not a path')).toBe(false);
        // URL
        expect(isFullPath('http://example.com')).toBe(false);
        // Unix-like relative path
        expect(isFullPath('./relative/path')).toBe(false);
    });
});
