import { MiddlewareAPI } from 'redux';
import { Dispatch, AppState, Action } from '../types';

export const routerMiddleware =
    (_api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        next(action);
    };
