import { validateParams } from '../paramsValidator';
import * as fixtures from '../__fixtures__/paramsValidator';

describe('helpers/paramsValidator', () => {
    describe('validateParams', () => {
        fixtures.validateParams.forEach(f => {
            it(f.description, () => {
                if (!f.success) {
                    expect(() =>
                        validateParams({ param: f.value }, [{ name: 'param', ...f }] as any),
                    ).toThrow();
                } else {
                    expect(() =>
                        validateParams({ param: f.value }, [{ name: 'param', ...f }] as any),
                    ).not.toThrow();
                }
            });
        });
    });

    describe('getFirmwareRange', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });
        fixtures.getFirmwareRange.forEach(f => {
            it(f.description, done => {
                jest.resetModules();

                const mock = f.config;
                jest.mock('../../../data/config', () => {
                    const actualConfig = jest.requireActual('../../../data/config').config;

                    return {
                        __esModule: true,
                        config: mock || actualConfig,
                    };
                });

                import('../paramsValidator').then(({ getFirmwareRange }) => {
                    // added new capability
                    // @ts-expect-error
                    expect(getFirmwareRange(...f.params)).toEqual(f.result);
                    done();
                });
            });
        });
    });
});
