/* eslint-disable @typescript-eslint/ban-types */
import { Action, AnyAction, Middleware, MiddlewareAPI } from 'redux';
import { ThunkDispatch } from '@reduxjs/toolkit';

import { ExtraDependencies } from './extraDependenciesType';

interface SimpleMiddleware<TAction extends Action, TExtraMiddlewareAPI = {}> {
    (
        action: TAction,
        api: MiddlewareAPI<ThunkDispatch<any, {}, AnyAction>> & TExtraMiddlewareAPI,
    ): void;
}

export const createMiddleware =
    <TAction extends Action = AnyAction>(simpleMiddleware: SimpleMiddleware<TAction>): Middleware =>
    (middlewareAPI: MiddlewareAPI) =>
    next =>
    action => {
        const returnValue = next(action);

        (async () => {
            try {
                await simpleMiddleware(action, middlewareAPI);
            } catch (error) {
                console.error(error);
            }
        })();

        return returnValue;
    };

type ExtraMiddlewareAPI = { extra: ExtraDependencies };

export const createMiddlewareWithExtraDependencies =
    <TAction extends Action = AnyAction>(
        simpleMiddleware: SimpleMiddleware<TAction, ExtraMiddlewareAPI>,
    ) =>
    (extra: ExtraDependencies): Middleware =>
    (middlewareAPI: MiddlewareAPI) =>
    next =>
    action => {
        const returnValue = next(action);

        (async () => {
            try {
                await simpleMiddleware(action, { ...middlewareAPI, extra });
            } catch (error) {
                console.error(error);
            }
        })();

        return returnValue;
    };
