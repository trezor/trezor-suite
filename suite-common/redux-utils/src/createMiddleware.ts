import { type ThunkDispatch } from '@reduxjs/toolkit';
import { type Action, type Dispatch, type Middleware, type MiddlewareAPI } from 'redux';

// TODO: This dependency on the global ExtraDependencies type is bad, temporary, terrible, and
// disastrous. Remove it in follow-ups tracked by https://github.com/trezor/trezor-suite/issues/30770.
import { type ExtraDependencies } from '@suite-common/redux-extra-dependencies';

import { type AnyAction } from './types';

interface SimpleMiddleware<TAction extends Action, TExtraMiddlewareAPI = unknown> {
    (
        action: TAction,
        api: MiddlewareAPI<ThunkDispatch<any, any, AnyAction>> &
            TExtraMiddlewareAPI & { next: Dispatch<AnyAction> },
    ): AnyAction | Promise<AnyAction>;
}

export const createMiddleware =
    <TAction extends Action = AnyAction>(simpleMiddleware: SimpleMiddleware<TAction>): Middleware =>
    (middlewareAPI: MiddlewareAPI<ThunkDispatch<any, unknown, AnyAction>>) =>
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

type ExtraMiddlewareAPI = { extra: ExtraDependencies };

export const createMiddlewareWithExtraDeps =
    <TAction extends Action = AnyAction>(
        simpleMiddleware: SimpleMiddleware<TAction, ExtraMiddlewareAPI>,
    ) =>
    (getExtra: () => ExtraDependencies | null): Middleware =>
    (middlewareAPI: MiddlewareAPI<ThunkDispatch<any, ExtraMiddlewareAPI, AnyAction>>) =>
    next =>
    action => {
        const extra = getExtra();
        if (!extra) {
            throw new Error(
                'createMiddlewareWithExtraDeps: This shoudnt ever happen: Extra dependencies not initialized',
            );
        }
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
