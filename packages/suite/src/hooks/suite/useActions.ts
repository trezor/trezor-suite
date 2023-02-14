import { useMemo, useRef } from 'react';
import { useDispatch } from '@suite-hooks';
import { bindActionCreators, ActionCreatorsMapObject } from 'redux';
import type { Action, ThunkAction } from '@suite-types';

export const useActions = <M extends ActionCreatorsMapObject<Action | ThunkAction>>(actions: M) => {
    const dispatch = useDispatch();
    const ref = useRef(actions);
    return useMemo(() => bindActionCreators(ref.current, dispatch), [dispatch, ref]);
};
