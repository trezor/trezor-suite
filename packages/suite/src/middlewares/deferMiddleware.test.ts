import { type Middleware, type MiddlewareAPI } from '@reduxjs/toolkit';

import { mock } from '@suite-common/dependency-injection';

import { deferMiddleware } from './deferMiddleware';

const action = { type: 'test/action' };

const createMiddlewareAPI = (): MiddlewareAPI => ({
    getState: () => ({}),
    dispatch: dispatchedAction => dispatchedAction,
});

describe('deferMiddleware', () => {
    it('resolves lazily and preserves middleware state and return values', () => {
        const middleware = mock<Middleware>(() => next => {
            let actionCount = 0;

            return dispatchedAction => {
                next(dispatchedAction);

                return ++actionCount;
            };
        });
        const getMiddleware = mock<() => Middleware>(() => middleware);
        const next = mock<(action: unknown) => unknown>(dispatchedAction => dispatchedAction);
        const dispatch = deferMiddleware(getMiddleware)(createMiddlewareAPI())(next);

        expect(getMiddleware).not.toHaveBeenCalled();
        expect(middleware).not.toHaveBeenCalled();

        expect(dispatch(action)).toBe(1);
        expect(dispatch(action)).toBe(2);
        expect(middleware).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledTimes(2);
        expect(next).toHaveBeenCalledWith(action);
    });

    it('keeps bound middleware state separate for each store', () => {
        const middleware: Middleware = () => next => {
            let actionCount = 0;

            return dispatchedAction => {
                next(dispatchedAction);

                return ++actionCount;
            };
        };
        const deferred = deferMiddleware(() => middleware);
        const next = mock<(action: unknown) => unknown>(dispatchedAction => dispatchedAction);
        const firstDispatch = deferred(createMiddlewareAPI())(next);
        const secondDispatch = deferred(createMiddlewareAPI())(next);

        expect(firstDispatch(action)).toBe(1);
        expect(firstDispatch(action)).toBe(2);
        expect(secondDispatch(action)).toBe(1);
    });

    it('rejects dispatch before injection and follows middleware replacements', () => {
        let injectedMiddleware: Middleware | undefined;
        const firstMiddleware = mock<Middleware>(() => next => next);
        const secondMiddleware = mock<Middleware>(() => next => next);
        const next = mock<(action: unknown) => unknown>(dispatchedAction => dispatchedAction);
        const dispatch = deferMiddleware(() => injectedMiddleware)(createMiddlewareAPI())(next);

        expect(() => dispatch(action)).toThrow(
            'Middleware must be injected before dispatching application actions.',
        );
        expect(next).not.toHaveBeenCalled();

        injectedMiddleware = firstMiddleware;
        expect(dispatch(action)).toBe(action);

        injectedMiddleware = secondMiddleware;
        expect(dispatch(action)).toBe(action);
        expect(dispatch(action)).toBe(action);
        expect(firstMiddleware).toHaveBeenCalledTimes(1);
        expect(secondMiddleware).toHaveBeenCalledTimes(1);
    });
});
