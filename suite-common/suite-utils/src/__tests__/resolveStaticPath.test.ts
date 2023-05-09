import { resolveStaticPath } from '../resolveStaticPath';

const OLD_ENV = { ...process.env };

describe('resolve static path', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    afterEach(() => {
        process.env = { ...OLD_ENV };
    });

    it('should return static path', () => {
        process.env.ASSET_PREFIX = '';
        expect(resolveStaticPath('mypath')).toBe('/static/mypath');
    });

    it('should return static path even if ASSET_PREFIX is undefined', () => {
        process.env.ASSET_PREFIX = undefined;
        expect(resolveStaticPath('mypath')).toBe('/static/mypath');
        expect(resolveStaticPath('/mypath')).toBe('/static/mypath');
    });

    it('should return static path prefixed with ASSET_PREFIX', () => {
        process.env.ASSET_PREFIX = 'brachName';
        expect(resolveStaticPath('mypath')).toBe('brachName/static/mypath');
        expect(resolveStaticPath('/mypath')).toBe('brachName/static/mypath');
    });
});
