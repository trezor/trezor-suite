import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { bindActionCreators, ActionCreatorsMapObject } from 'redux';
import { Action, Dispatch } from '@suite-types';

export const useActions = <M extends ActionCreatorsMapObject<any>>(actions: M) => {
    const dispatch = useDispatch<Dispatch>();
    return useMemo(() => {
        return bindActionCreators(actions, dispatch);
    }, [dispatch, actions]);
};
