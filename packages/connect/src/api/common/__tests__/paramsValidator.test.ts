import * as data from '../../../data/config';
import * as fixtures from '../__fixtures__/paramsValidator';
import { getFirmwareRange, validateParams } from '../paramsValidator';

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
            jest.restoreAllMocks();
        });

        fixtures.getFirmwareRange.forEach(f => {
            it(f.description, () => {
                if (f.config) jest.replaceProperty(data, 'config', f.config as any);

                expect(
                    // @ts-expect-error
                    getFirmwareRange([f.params[0]], f.params[1] ? [f.params[1]] : [], f.params[2]),
                ).toEqual(f.result);
            });
        });
    });
});
