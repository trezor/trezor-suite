/* eslint-disable @typescript-eslint/no-var-requires, global-require */
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
});

export {};
