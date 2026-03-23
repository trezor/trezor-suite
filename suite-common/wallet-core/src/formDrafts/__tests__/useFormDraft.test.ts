import { type FormDraftRootState } from '../formDraftSlice';
import { useFormDraft } from '../useFormDraft';

const mockDispatch = jest.fn();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useCallback: (fn: unknown) => fn,
}));

jest.mock('react-redux', () => {
    const state: FormDraftRootState = {
        wallet: {
            formDrafts: {
                'stake/eth': {
                    key1: 'value1',
                },
            },
        },
    };

    return {
        useDispatch: () => mockDispatch,
        useSelector: (selector: (state: FormDraftRootState) => unknown) => selector(state),
    };
});

describe('useFormDraft', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return draft based on prefix and key', () => {
        const { draft } = useFormDraft('stake', 'eth');

        expect(draft).toEqual({ key1: 'value1' });
    });

    it('should dispatch storeDraft action on saveDraft call', () => {
        const { saveDraft } = useFormDraft('stake', 'eth');

        saveDraft({ key2: 'value2' });

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: '@formDraft/storeDraft',
            payload: { key: 'stake/eth', formDraft: { key2: 'value2' } },
        });
    });

    it('should dispatch removeDraft on removeDraft call', () => {
        const { removeDraft } = useFormDraft('stake', 'eth');

        removeDraft();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith({
            type: '@formDraft/removeDraft',
            payload: { key: 'stake/eth' },
        });
    });

    it('should allow to omit key', () => {
        const { draft, saveDraft, removeDraft } = useFormDraft('stake');

        expect(draft).toBeUndefined();
        saveDraft({ key3: 'value3' });
        removeDraft();

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
});
