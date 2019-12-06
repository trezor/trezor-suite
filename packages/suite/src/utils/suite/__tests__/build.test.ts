import { isDev, isBeta } from '../build';

describe('build', () => {
    describe('dev true by BUILD variable', () => {
        const OLD_ENV = { ...process.env };

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
        const OLD_ENV = { ...process.env };

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
        const OLD_ENV = { ...process.env };

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
        const OLD_ENV = { ...process.env };

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
        const OLD_ENV = { ...process.env };

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
