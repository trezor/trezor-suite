import { ThunkDispatch } from '@reduxjs/toolkit';
import { Action, Dispatch, Middleware, MiddlewareAPI } from 'redux';

import { ExtraDependenciesStatic } from './extraDependenciesType';
import { AnyAction } from './types';

interface SimpleMiddleware<TAction extends Action, TExtraMiddlewareAPI = {}> {
    (
        action: TAction,
        api: MiddlewareAPI<ThunkDispatch<any, any, AnyAction>> &
            TExtraMiddlewareAPI & { next: Dispatch<AnyAction> },
    ): AnyAction | Promise<AnyAction>;
}

export const createMiddleware =
    <TAction extends Action = AnyAction>(simpleMiddleware: SimpleMiddleware<TAction>): Middleware =>
    (middlewareAPI: MiddlewareAPI<ThunkDispatch<any, {}, AnyAction>>) =>
    next =>
    action => {
        try {
            return simpleMiddleware(action as TAction, {
                ...middlewareAPI,
                next: next as Dispatch,
            });
        } catch (error) {
            console.error(error);
        }
    };

type ExtraMiddlewareAPI = { extra: ExtraDependenciesStatic };

export const createMiddlewareWithExtraDeps =
    <TAction extends Action = AnyAction>(
        simpleMiddleware: SimpleMiddleware<TAction, ExtraMiddlewareAPI>,
    ) =>
    (extra: ExtraDependenciesStatic): Middleware =>
    (middlewareAPI: MiddlewareAPI<ThunkDispatch<any, ExtraMiddlewareAPI, AnyAction>>) =>
    next =>
    action => {
        try {
            return simpleMiddleware(action as TAction, {
                ...middlewareAPI,
                extra,
                next: next as Dispatch,
            });
        } catch (error) {
            console.error(error);
        }
    };
