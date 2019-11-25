import { resolveStaticPath } from '../nextjs';

describe('resolve static path', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
        delete process.env.assetPrefix;
    });

    afterEach(() => {
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
