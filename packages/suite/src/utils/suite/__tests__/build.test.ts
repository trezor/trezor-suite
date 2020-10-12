import { isDev, normalizeVersion } from '../build';

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
        });
    });
});
