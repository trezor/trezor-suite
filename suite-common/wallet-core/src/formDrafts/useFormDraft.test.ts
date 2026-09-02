/**
 * @jest-environment jsdom
 */
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';

import { type FormDraftRootState } from './formDraftSlice';
import { useFormDraft } from './useFormDraft';

const mockDispatch = jest.fn();

const state: FormDraftRootState = {
    wallet: {
        formDrafts: {
            'stake/eth': {
                key1: 'value1',
            },
        },
    },
};

const createRoot = () => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: state,
    });
    root.store.dispatch = mockDispatch;

    return root;
};

const renderUseFormDraft = (key = 'eth') =>
    renderHookWithStoreProvider(() => useFormDraft('stake', key), {
        root: createRoot(),
    });

describe('useFormDraft', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return draft based on prefix and key', () => {
        const { result } = renderUseFormDraft();

        expect(result.current.draft).toEqual({ key1: 'value1' });
    });

    it('should dispatch storeDraft action on saveDraft call', () => {
        const { result } = renderUseFormDraft();

        result.current.saveDraft({ key2: 'value2' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: '@formDraft/storeDraft',
            payload: { key: 'stake/eth', formDraft: { key2: 'value2' } },
        });
    });

    it('should dispatch removeDraft on removeDraft call', () => {
        const { result } = renderUseFormDraft();

        result.current.removeDraft();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: '@formDraft/removeDraft',
            payload: { key: 'stake/eth' },
        });
    });

    it('should allow to omit key', () => {
        const { result } = renderUseFormDraft('');

        expect(result.current.draft).toBeUndefined();
        result.current.saveDraft({ key3: 'value3' });
        result.current.removeDraft();

        expect(mockDispatch).toHaveBeenCalledTimes(2);
        expect(mockDispatch).toHaveBeenNthCalledWith(1, {
            type: '@formDraft/storeDraft',
            payload: { key: 'stake/', formDraft: { key3: 'value3' } },
        });
        expect(mockDispatch).toHaveBeenNthCalledWith(2, {
            type: '@formDraft/removeDraft',
            payload: { key: 'stake/' },
        });
    });

    it('should return formDraftKey', () => {
        const { result } = renderUseFormDraft();

        expect(result.current.formDraftKey).toBe('stake/eth');
    });
});
