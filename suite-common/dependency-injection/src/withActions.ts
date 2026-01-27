import { ServiceFunction } from './service';

type ServiceAction = { type: string };

export const withActions = <
    TReturn,
    TParams extends any[],
    TDeps extends { dispatch: (action: ServiceAction) => void },
>(
    factory: (deps: TDeps) => ServiceFunction<TReturn, TParams>, // Todo: solve for anonymous function
) => {
    const wrappedFactory =
        (deps: TDeps) =>
        (...args: TParams): TReturn => {
            const it = factory(deps);

            deps.dispatch({ type: `${factory.name}/started` });
            const result = it(...args); // Todo: solve async
            deps.dispatch({ type: `${factory.name}/fulfilled` });

            return result;
        };

    wrappedFactory.type = {
        started: `${factory.name}/started`,
        fulfilled: `${factory.name}/fulfilled`,
    };

    return wrappedFactory;
};
