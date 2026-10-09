import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type Action, type Dispatch, type Middleware, type MiddlewareAPI } from 'redux';

// Reading state and dispatching a thunk are two different permissions. A middleware may be banned
// from reading state itself (`TState` is `void`) and still dispatch a thunk that reads the state it
// declared for itself. Think of it like asking another student to open a book you are not allowed
// to open: your restriction does not become their restriction. Keeping dispatch broad makes that
// composition possible, while `getState()` below stays limited to `TState`.
type CreateMiddlewareDispatch = ThunkDispatch<any, any, UnknownAction>;

// Redux middleware normally has several nested functions. `SimpleMiddleware` is the smaller
// callback shape that this file exposes to application code. Its three important inputs are:
//
// - `TAction`, which says what kind of action the callback receives.
// - `TState`, which says what `getState()` returns. `void` means no state may be read.
// - `TExtraMiddlewareAPI`, which adds only the dependencies selected by this middleware.
//
// The `&` signs combine those API pieces, like snapping Lego bricks together into one object.
interface SimpleMiddleware<
    TAction extends Action,
    TExtraMiddlewareAPI = Record<never, never>,
    TState = any,
> {
    (
        action: TAction,
        api: MiddlewareAPI<CreateMiddlewareDispatch, TState> &
            TExtraMiddlewareAPI & { next: Dispatch<UnknownAction> },
    ): UnknownAction | Promise<UnknownAction>;
}

export const createMiddleware =
    <TAction extends Action = UnknownAction>(
        simpleMiddleware: SimpleMiddleware<TAction>,
    ): Middleware =>
    (middlewareAPI: MiddlewareAPI<ThunkDispatch<any, unknown, UnknownAction>>) =>
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

// A dependency-free middleware writes `void` as its dependency type. In that case its callback
// must not receive an `extra` property at all. Otherwise, the selected dependencies are exposed as
// `extra`. Boxing `TExtra` in square brackets makes a union behave as one type during the check.
type ExtraMiddlewareAPI<TExtra> = [TExtra] extends [void]
    ? Record<never, never>
    : { extra: TExtra };

// The outer factory always reads the application's dependency object at runtime. When this one
// middleware selected no dependencies, `unknown` says that an object may still be supplied but the
// middleware is not allowed to know or use its shape.
type MiddlewareExtra<TExtra> = [TExtra] extends [void] ? unknown : TExtra;

// We want every caller to write all three types explicitly:
// `createMiddlewareWithExtraDeps<Extra, Action, State>(...)`.
//
// Simply removing the generic defaults does not achieve that. TypeScript tries to be helpful and
// guesses missing types from the callback, just like filling in blank answers for you. We need a
// way to notice that a caller left a blank instead of writing the type themselves.
//
// This unique symbol is a private sticker that no real dependency, action, or state type has. The
// `MiddlewareTypeParameterIsRequired` type below carries that sticker. It also includes `Action`
// because it must be usable as the fallback for `TAction extends Action`.
declare const _middlewareTypeParameterIsRequired: unique symbol;

type MiddlewareTypeParameterIsRequired = Action & {
    [_middlewareTypeParameterIsRequired]: never;
};

// Read this type from top to bottom as three questions:
//
// 1. Is the dependency type still our "you forgot this type" marker?
// 2. Is the action type still the marker?
// 3. Is the state type still the marker?
//
// The square brackets make TypeScript compare each answer as one whole type. Without them, a union
// could be split into pieces and checked piece by piece, which is not what we want here.
//
// If any answer is yes, the callback becomes `never`. Nothing can be passed where `never` is
// expected, so TypeScript shows an error at the call site. If all three real types were supplied,
// the last branch produces the normal `SimpleMiddleware` callback type.
type ExplicitlyTypedSimpleMiddleware<TExtra, TAction extends Action, TState> = [TExtra] extends [
    MiddlewareTypeParameterIsRequired,
]
    ? never
    : [TAction] extends [MiddlewareTypeParameterIsRequired]
      ? never
      : [TState] extends [MiddlewareTypeParameterIsRequired]
        ? never
        : SimpleMiddleware<TAction, ExtraMiddlewareAPI<TExtra>, TState>;

// This first overload is the contract callers see. Its defaults are alarm markers, not useful
// defaults. Omitting any generic selects the marker, and `ExplicitlyTypedSimpleMiddleware` above
// then rejects the callback.
export function createMiddlewareWithExtraDeps<
    TExtra = MiddlewareTypeParameterIsRequired,
    TAction extends Action = MiddlewareTypeParameterIsRequired,
    TState = MiddlewareTypeParameterIsRequired,
>(
    simpleMiddleware: ExplicitlyTypedSimpleMiddleware<TExtra, TAction, TState>,
): (getExtra: () => MiddlewareExtra<TExtra> | null) => Middleware;

// This second signature contains the JavaScript implementation. By the time TypeScript accepts a
// call and reaches this body, the public overload above has proved that all three real types exist.
export function createMiddlewareWithExtraDeps<TExtra, TAction extends Action, TState>(
    simpleMiddleware: ExplicitlyTypedSimpleMiddleware<TExtra, TAction, TState>,
) {
    return (getExtra: () => MiddlewareExtra<TExtra> | null): Middleware =>
        (middlewareAPI: MiddlewareAPI<ThunkDispatch<any, unknown, UnknownAction>>) =>
        next =>
        action => {
            const extra = getExtra();
            if (!extra) {
                throw new Error(
                    'createMiddlewareWithExtraDeps: Extra dependencies are not initialized',
                );
            }
            try {
                // Redux gives this factory a broadly typed API object. Here we attach the runtime
                // dependencies and `next`, then reconnect that object to the three types supplied
                // by the caller. This assertion is the boundary between Redux's broad middleware
                // type and our narrower callback type; application code after this point sees only
                // its declared action, state, and dependencies.
                const simpleMiddlewareAPI = {
                    ...middlewareAPI,
                    extra,
                    next: next as Dispatch,
                } as MiddlewareAPI<CreateMiddlewareDispatch, TState> &
                    ExtraMiddlewareAPI<TExtra> & { next: Dispatch<UnknownAction> };

                return simpleMiddleware(action as TAction, simpleMiddlewareAPI);
            } catch (error) {
                console.error(error);
            }
        };
}
