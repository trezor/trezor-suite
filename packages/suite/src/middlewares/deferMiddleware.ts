import { type Middleware } from '@reduxjs/toolkit';

export const deferMiddleware = (getMiddleware: () => Middleware | undefined): Middleware =>
    api => next => {
        let currentMiddleware: Middleware | undefined;
        let handleAction: ((action: unknown) => unknown) | undefined;

        return action => {
            const middleware = getMiddleware();
            if (!middleware) {
                throw new Error(
                    'Middleware must be injected before dispatching application actions.',
                );
            }

            // Preserve middleware-local state across actions, but rebind if injection replaces it.
            if (middleware !== currentMiddleware || !handleAction) {
                handleAction = middleware(api)(next);
                currentMiddleware = middleware;
            }

            return handleAction(action);
        };
    };
