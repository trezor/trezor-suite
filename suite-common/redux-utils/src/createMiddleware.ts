/* eslint-disable @typescript-eslint/ban-types */
import { Action, AnyAction, Dispatch, Middleware, MiddlewareAPI } from 'redux';
import { ThunkDispatch } from '@reduxjs/toolkit';

import { ExtraDependencies } from './extraDependenciesType';

interface SimpleMiddleware<TAction extends Action, TExtraMiddlewareAPI = {}> {
    (
        action: TAction,
        api: MiddlewareAPI<ThunkDispatch<any, {}, AnyAction>> &
            TExtraMiddlewareAPI & { next: Dispatch<AnyAction> },
    ): AnyAction;
}

export const createMiddleware =
    <TAction extends Action = AnyAction>(simpleMiddleware: SimpleMiddleware<TAction>): Middleware =>
    (middlewareAPI: MiddlewareAPI) =>
    next =>
    action => {
        try {
            return simpleMiddleware(action, { ...middlewareAPI, next });
        } catch (error) {
            console.error(error);
        }
    };

type ExtraMiddlewareAPI = { extra: ExtraDependencies };

export const createMiddlewareWithExtraDeps =
    <TAction extends Action = AnyAction>(
        simpleMiddleware: SimpleMiddleware<TAction, ExtraMiddlewareAPI>,
    ) =>
    (extra: ExtraDependencies): Middleware =>
    (middlewareAPI: MiddlewareAPI) =>
    next =>
    action => {
        try {
            return simpleMiddleware(action, { ...middlewareAPI, extra, next });
        } catch (error) {
            console.error(error);
        }
    };
