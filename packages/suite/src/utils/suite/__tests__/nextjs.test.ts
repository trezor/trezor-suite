import { resolveStaticPath } from '../nextjs';

const OLD_ENV = { ...process.env };

describe('resolve static path', () => {
    afterEach(() => {
        // restore old env vars
        process.env = OLD_ENV;
    });
    it('should return static path', () => {
        process.env.assetPrefix = '';
        expect(resolveStaticPath('mypath')).toBe('/static/mypath');
    });

    it('should return static path prefixed with assetPrefix', () => {
        process.env.assetPrefix = 'brachName';
        expect(resolveStaticPath('mypath')).toBe('brachName/static/mypath');
    });
});
