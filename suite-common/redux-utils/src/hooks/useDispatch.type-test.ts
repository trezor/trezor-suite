import { createThunk } from '../createThunk';
import { useDispatch } from './useDispatch';

const useDispatchTypeTest = () => {
    const dispatch = useDispatch();

    const plainAction = {
        type: 'test/plainAction',
        payload: 42,
    } as const;
    const dispatchedPlainAction: typeof plainAction = dispatch(plainAction);

    const vanillaThunk = (_dispatch: unknown, _getState: unknown, _extra: unknown) =>
        'result' as const;
    const vanillaThunkResult: 'result' = dispatch(vanillaThunk);

    const asyncThunk = createThunk<string, number, void>('test/asyncThunk', payload =>
        payload.toString(),
    );
    const asyncThunkResult = dispatch(asyncThunk(42));
    const unwrappedAsyncThunkResult: Promise<string> = asyncThunkResult.unwrap();

    // @ts-expect-error Dispatch accepts Redux actions and callable thunk actions only.
    dispatch('not-an-action');

    void dispatchedPlainAction;
    void vanillaThunkResult;
    void unwrappedAsyncThunkResult;
};

void useDispatchTypeTest;
