import { resolveStaticPath } from './resolveStaticPath';

const OLD_ENV = { ...process.env };

describe(resolveStaticPath.name, () => {
    beforeEach(() => {
        jest.resetModules();
    });

    afterEach(() => {
        process.env = { ...OLD_ENV };
    });

    it('return default static path with empty ASSET_PREFIX', () => {
        process.env.ASSET_PREFIX = '';
        expect(resolveStaticPath('mypath')).toBe('/static/mypath');
    });

    it('return default static path with undefined ASSET_PREFIX', () => {
        process.env.ASSET_PREFIX = undefined;
        expect(resolveStaticPath('mypath')).toBe('/static/mypath');
        expect(resolveStaticPath('/mypath')).toBe('/static/mypath');
    });

    it('return static path prefixed with branch name ASSET_PREFIX', () => {
        process.env.ASSET_PREFIX = 'branchName';
        expect(resolveStaticPath('mypath')).toBe('branchName/static/mypath');
        expect(resolveStaticPath('/mypath')).toBe('branchName/static/mypath');
    });

    it('return static path prefixed with ASSET_PREFIX that is used on Suite Desktop', () => {
        process.env.ASSET_PREFIX = '.';
        expect(resolveStaticPath('mypath')).toBe('./static/mypath');
        expect(resolveStaticPath('/mypath')).toBe('./static/mypath');
    });
});
