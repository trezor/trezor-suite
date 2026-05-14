import { config } from '../../../data/config';
import * as fixtures from '../__fixtures__/paramsValidator';
import { getFirmwareRange, validateParams } from '../paramsValidator';

jest.mock('../../../data/config', () => {
    const actual = jest.requireActual('../../../data/config');

    return {
        __esModule: true,
        config: { ...actual.config },
    };
});

const originalConfig = jest.requireActual('../../../data/config').config;

const resetConfig = () => {
    Object.keys(config).forEach(key => {
        delete (config as Record<string, unknown>)[key];
    });
    Object.assign(config, originalConfig);
};

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
            resetConfig();
        });

        fixtures.getFirmwareRange.forEach(f => {
            it(f.description, () => {
                if (f.config) {
                    resetConfig();
                    Object.keys(config).forEach(key => {
                        delete (config as Record<string, unknown>)[key];
                    });
                    Object.assign(config, f.config);
                }

                const [method, coinInfo, defaultRange] = f.params;
                expect(
                    // @ts-expect-error
                    getFirmwareRange([method], coinInfo ? [coinInfo] : [], defaultRange),
                ).toEqual(f.result);
            });
        });
    });
});
