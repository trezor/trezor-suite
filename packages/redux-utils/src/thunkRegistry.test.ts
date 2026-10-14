import { createSingleInstanceThunk } from './createSingleInstanceThunk';
import { createThunk } from './createThunk';
import { getRegisteredThunk, getRegisteredThunkTypePrefixes } from './thunkRegistry';

describe('thunkRegistry', () => {
    it('registers every thunk created with createThunk by its type prefix', () => {
        const thunk = createThunk<number, void, void>('@test/registry/created', () => 1);

        expect(getRegisteredThunk('@test/registry/created')).toBe(thunk);
        expect(getRegisteredThunkTypePrefixes()).toContain('@test/registry/created');
    });

    it('registers every thunk created with createSingleInstanceThunk by its type prefix', () => {
        const thunk = createSingleInstanceThunk<void, number, void>(
            '@test/registry/single-instance',
            () => 1,
        );

        expect(getRegisteredThunk('@test/registry/single-instance')).toBe(thunk);
    });

    it('answers undefined for an unknown type prefix', () => {
        expect(getRegisteredThunk('@test/registry/unknown')).toBeUndefined();
    });
});
