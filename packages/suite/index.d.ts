interface Window {
    mozIndexedDB: IDBDatabase | null;
    webkitIndexedDB: IDBDatabase | null;
    msIndexedDB: IDBDatabase | null;
    shimIndexedDB: IDBDatabase | null;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: () => any | null;
}

const window: Window;

declare module 'redux-async-initial-state' {
    interface StorageState {
        loading: boolean;
        loaded: boolean;
        error: string | null;
    }
    export function outerReducer<T>(reducers: any): T;
    export function innerReducer(): StorageState;
    export function middleware(load: Function): any;
}
