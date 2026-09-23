import { type BluetoothMiddlewareDep } from '@suite/bluetooth';

export type SuiteMiddlewares = BluetoothMiddlewareDep;

export type SuiteMiddlewaresDep = {
    middlewares: SuiteMiddlewares;
};
