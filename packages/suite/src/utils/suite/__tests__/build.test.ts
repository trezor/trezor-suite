import { isDev, isBeta } from '../build';

const OLD_ENV = { ...process.env };

describe('build', () => {
    describe('dev true by BUILD variable', () => {
        beforeEach(() => {
            jest.resetModules();
            process.env.BUILD = 'development';
        });

        afterEach(() => {
            process.env = OLD_ENV;
        });

        it('isDev', () => {
            expect(isDev()).toEqual(true);
        });
    });

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

    describe('beta true by BUILD variable', () => {
        beforeEach(() => {
            jest.resetModules();
            process.env.BUILD = 'beta';
        });

        afterEach(() => {
            process.env = OLD_ENV;
        });

        it('isDev', () => {
            expect(isBeta()).toEqual(true);
        });
    });

    describe('should NOT be beta', () => {
        beforeEach(() => {
            jest.resetModules();
            process.env.BUILD = 'something';
        });

        afterEach(() => {
            process.env = OLD_ENV;
        });

        it('isDev', () => {
            expect(isBeta()).toEqual(false);
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
});
