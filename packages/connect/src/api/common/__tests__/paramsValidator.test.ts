// @ts-nocheck
// REF-TODO: ts

import { DataManager } from '../../../data/DataManager';
import { config } from '../../../data/config';
import { validateParams, getFirmwareRange } from '../paramsValidator';
import * as fixtures from '../__fixtures__/paramsValidator';

describe('helpers/paramsValidator', () => {
    describe('validateParams', () => {
        fixtures.validateParams.forEach(f => {
            it(f.description, () => {
                if (!f.success) {
                    expect(() =>
                        validateParams({ param: f.value }, [{ name: 'param', ...f }]),
                    ).toThrow();
                } else {
                    expect(() =>
                        validateParams({ param: f.value }, [{ name: 'param', ...f }]),
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
            it(f.description, () => {
                jest.spyOn(DataManager, 'getConfig').mockImplementation(() => f.config || config);
                expect(getFirmwareRange(...f.params)).toEqual(f.result);
            });
        });
    });
});
