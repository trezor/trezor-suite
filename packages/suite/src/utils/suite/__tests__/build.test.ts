/* eslint-disable global-require, @typescript-eslint/no-var-requires */
import { normalizeVersion, resolveStaticPath } from '../build';

const OLD_ENV = { ...process.env };

describe('build', () => {
    describe('isDev', () => {
        beforeEach(() => {
            jest.resetModules();
        });

        afterEach(() => {
            process.env = { ...OLD_ENV };
        });

        it.only('dev false when NODE_ENV is production', () => {
            process.env.NODE_ENV = 'production';
            const { isDev } = require('../build');

            expect(isDev).toEqual(false);
        });

        it('dev true when NODE_ENV is development', () => {
            process.env.NODE_ENV = 'development';
            const { isDev } = require('../build');

            expect(isDev).toEqual(true);
        });

        it('dev true when NODE_ENV is anything excluding production', () => {
            process.env.NODE_ENV = 'anything';
            const { isDev } = require('../build');

            expect(isDev).toEqual(true);
        });

        it('dev true when NODE_ENV is not set', () => {
            process.env.NODE_ENV = undefined;
            const { isDev } = require('../build');

            expect(isDev).toEqual(true);
        });
    });

    describe('normalizeVersion', () => {
        it('removes preceding zeros from versions to normalize it', () => {
            expect(normalizeVersion('2020.05.13-beta')).toEqual('2020.5.13-beta');
            expect(normalizeVersion('2022.12.01-beta')).toEqual('2022.12.1-beta');
            expect(normalizeVersion('3000.04.04-beta')).toEqual('3000.4.4-beta');
            expect(normalizeVersion('3000.04.04')).toEqual('3000.4.4');
            expect(normalizeVersion('3000.04.0')).toEqual('3000.4.0');
        });

        it('does nothing with normalized versions', () => {
            expect(normalizeVersion('20.11.0')).toEqual('20.11.0');
            expect(normalizeVersion('20.11.1')).toEqual('20.11.1');
        });
    });

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
});
