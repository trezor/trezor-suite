/* eslint-disable @typescript-eslint/no-var-requires */
const OLD_ENV = { ...process.env };

describe('build', () => {
    describe('isDevEnv', () => {
        beforeEach(() => {
            jest.resetModules();
        });

        afterEach(() => {
            process.env = { ...OLD_ENV };
        });

        it.only('dev false when NODE_ENV is production', () => {
            process.env.NODE_ENV = 'production';
            const { isDevEnv } = require('../build');

            expect(isDevEnv).toEqual(false);
        });

        it('dev true when NODE_ENV is development', () => {
            process.env.NODE_ENV = 'development';
            const { isDevEnv } = require('../build');

            expect(isDevEnv).toEqual(true);
        });

        it('dev true when NODE_ENV is anything excluding production', () => {
            process.env.NODE_ENV = 'anything';
            const { isDevEnv } = require('../build');

            expect(isDevEnv).toEqual(true);
        });

        it('dev true when NODE_ENV is not set', () => {
            process.env.NODE_ENV = undefined;
            const { isDevEnv } = require('../build');

            expect(isDevEnv).toEqual(true);
        });
    });
});

export {};
