// Service can be a function
export type ServiceFunction<TReturn, TParams extends any[]> = (...args: TParams) => TReturn;

// or a static configuration
export type StaticConfiguration = string | number | boolean;

// or object, where properties can be other services => recursive
export type RecursiveDeps = {
    [key: string]: ServiceFunction<any, any> | RecursiveDeps | StaticConfiguration;
};
