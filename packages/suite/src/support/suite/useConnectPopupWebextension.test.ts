import { resolvePinnedExtensionId } from './useConnectPopupWebextension';

const LEGIT_EXTENSION_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const FOREIGN_EXTENSION_ID = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

describe('resolvePinnedExtensionId', () => {
    it('pins the first extension id of the page load', () => {
        expect(resolvePinnedExtensionId(null, LEGIT_EXTENSION_ID)).toEqual({
            accept: true,
            pinnedExtensionId: LEGIT_EXTENSION_ID,
        });
    });

    it('accepts a write carrying the pinned extension id', () => {
        expect(resolvePinnedExtensionId(LEGIT_EXTENSION_ID, LEGIT_EXTENSION_ID)).toEqual({
            accept: true,
            pinnedExtensionId: LEGIT_EXTENSION_ID,
        });
    });

    it('rejects a write carrying a foreign extension id and keeps the pin', () => {
        expect(resolvePinnedExtensionId(LEGIT_EXTENSION_ID, FOREIGN_EXTENSION_ID)).toEqual({
            accept: false,
            pinnedExtensionId: LEGIT_EXTENSION_ID,
        });
    });

    it('keeps the pin when the write carries no extension id', () => {
        expect(resolvePinnedExtensionId(LEGIT_EXTENSION_ID, null)).toEqual({
            accept: true,
            pinnedExtensionId: LEGIT_EXTENSION_ID,
        });
    });

    it('pins nothing when neither the page load nor the write has an id', () => {
        expect(resolvePinnedExtensionId(null, null)).toEqual({
            accept: true,
            pinnedExtensionId: null,
        });
    });
});
