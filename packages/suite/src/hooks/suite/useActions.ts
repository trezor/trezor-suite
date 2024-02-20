import { useMemo, useRef } from 'react';
import { ActionCreatorsMapObject, bindActionCreators } from 'redux';
import { useDispatch } from 'react-redux';
import type { Action, ThunkAction } from 'src/types/suite';

export const useActions = <M extends ActionCreatorsMapObject<Action | ThunkAction>>(actions: M) => {
    const dispatch = useDispatch();
    const ref = useRef(actions);

    return useMemo(() => bindActionCreators(ref.current, dispatch), [dispatch, ref]);
};
