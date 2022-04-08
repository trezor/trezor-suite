import { parseArrayType, encodeData, getFieldType } from '../ethereumSignTypedData';
import * as fixtures from '../__fixtures__/ethereumSignTypedData';

describe('helpers/ethereumSignTypeData', () => {
    describe('parseArrayType', () => {
        fixtures.parseArrayType.forEach(f => {
            it(`${f.description} - ${f.input}`, () => {
                if (f.error) {
                    expect(() => parseArrayType(f.input)).toThrowError(...f.error);
                } else {
                    expect(parseArrayType(f.input)).toEqual(f.output);
                }
            });
        });
    });

    describe('getFieldType', () => {
        fixtures.getFieldType.forEach(f => {
            const { typeName, types } = f.input;
            it(`${f.description} - ${typeName}`, () => {
                if (f.error) {
                    expect(() => getFieldType(typeName, types as any)).toThrowError(...f.error);
                } else {
                    expect(getFieldType(typeName, types as any)).toEqual(f.output);
                }
            });
        });
    });

    describe('encodeData', () => {
        fixtures.encodeData.forEach(f => {
            const { typeName, data } = f.input;
            it(`${f.description}`, () => {
                if (f.error) {
                    expect(() => encodeData(typeName, data)).toThrowError(...f.error);
                } else {
                    expect(encodeData(typeName, data)).toEqual(f.output);
                }
            });
        });
    });
});
