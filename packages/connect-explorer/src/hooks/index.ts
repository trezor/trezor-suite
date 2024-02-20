import { useRef, useMemo } from 'react';
import { useDispatch, useSelector as useSelectorOrig } from 'react-redux';
import { bindActionCreators } from 'redux';

import type { TypedUseSelectorHook } from 'react-redux';
import type { ActionCreatorsMapObject } from 'redux';
import type { AppState, Dispatch } from '../types';

export const useSelector: TypedUseSelectorHook<AppState> = useSelectorOrig;

export const useActions = <M extends ActionCreatorsMapObject<any>>(actions: M) => {
    const dispatch = useDispatch<Dispatch>();
    const ref = useRef(actions);

    return useMemo(() => bindActionCreators(ref.current, dispatch), [dispatch, ref]);
};
