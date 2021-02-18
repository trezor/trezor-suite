import { isDev, normalizeVersion, resolveStaticPath } from '../build';

const OLD_ENV = { ...process.env };

describe('build', () => {
    describe('dev true by NODE_ENV variable', () => {
        beforeEach(() => {
            jest.resetModules();
            process.env.NODE_ENV = 'development';
        });

        afterEach(() => {
            process.env = OLD_ENV;
        });

        it('isDev', () => {
            expect(isDev()).toEqual(true);
        });
    });

    describe('should NOT be development', () => {
        beforeEach(() => {
            jest.resetModules();
            process.env.NODE_ENV = 'something';
        });

        afterEach(() => {
            process.env = OLD_ENV;
        });

        it('isDev', () => {
            expect(isDev()).toEqual(false);
        });
    });

    describe('normalizeVersion', () => {
        beforeEach(() => {
            jest.resetModules();
            process.env.BUILD = 'development';
        });

        afterEach(() => {
            process.env = OLD_ENV;
        });

        it('normalizeVersion', () => {
            expect(normalizeVersion('2020.05.13-beta')).toEqual('2020.5.13-beta');
            expect(normalizeVersion('2022.12.01-beta')).toEqual('2022.12.1-beta');
            expect(normalizeVersion('3000.04.04-beta')).toEqual('3000.4.4-beta');
            expect(normalizeVersion('3000.04.04')).toEqual('3000.4.4');
            expect(normalizeVersion('3000.04.0')).toEqual('3000.4.0');
            expect(normalizeVersion('20.11.0')).toEqual('20.11.0');
            expect(normalizeVersion('20.11.1')).toEqual('20.11.1');
        });
    });

    describe('resolve static path', () => {
        afterEach(() => {
            // restore old env vars
            process.env = OLD_ENV;
        });
        it('should return static path', () => {
            process.env.ASSET_PREFIX = '';
            expect(resolveStaticPath('mypath')).toBe('/static/mypath');
        });

        it('should return static path prefixed with ASSET_PREFIX', () => {
            process.env.ASSET_PREFIX = 'brachName';
            expect(resolveStaticPath('mypath')).toBe('brachName/static/mypath');
        });
    });
});
