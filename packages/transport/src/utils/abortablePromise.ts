// from https://github.com/zzdjk6/simple-abortable-promise

import type { Controller as AbortcontrollerType } from './abortController';
// When abort happens, this error will be throw
export class AbortError extends Error {
    constructor(message: string = 'Aborted') {
        super(message);
        this.name = 'AbortError';
    }
}

// General interface of Abortable
export interface Abortable {
    abort: (reason?: string) => void;
    readonly abortReason?: string;
}

// The executor function should be passed to the constructor when create a Promise
interface ExecutorFunction<T> {
    (resolve: (value?: PromiseLike<T> | T) => void, reject: (reason?: any) => void): void;
}

// The executor function should be passed to the constructor when create a AbortablePromise
interface AbortableExecutorFunction<T> {
    (
        resolve: (value?: PromiseLike<T> | T) => void,
        reject: (reason?: any) => void,
        abortController: AbortSignal,
    ): void;
}

// AbortablePromise is a subclass of Promise that implements Abortable interface
export class AbortablePromise<T> extends Promise<T> implements Abortable {
    // Method defination `.abort()`
    public abort: Abortable['abort'];

    // Getter to access abort reason
    public get abortReason(): string | undefined {
        return this._abortReason;
    }

    // Internal store of abort reason
    private _abortReason?: string;

    // Constructor, note we can provide 3 args: resolve, reject, abortSignal
    constructor(
        executor: AbortableExecutorFunction<T>,
        // optionally custom abortController instance
        abortControllerParam?: AbortcontrollerType,
    ) {
        const abortController = abortControllerParam || new AbortController();
        const abortSignal = abortController.signal;

        // This is the executor function to be passsed to the superclass - Promise
        const normalExecutor: ExecutorFunction<T> = (resolve, reject) => {
            abortSignal.addEventListener('abort', () => {
                reject(new AbortError(this.abortReason));
            });

            // todo:
            // @ts-expect-error
            executor(resolve, reject, abortSignal);
        };
        // todo:
        // @ts-expect-error
        super(normalExecutor);

        // Bind the abort method
        this.abort = reason => {
            this._abortReason = reason ? reason : 'Aborted';
            abortController.abort();
        };
    }

    // Wrap other Promise instances to AbortablePromise
    static from = <T>(promise: Promise<T>): AbortablePromise<T> => {
        // If promise is already an AbortablePromise, return it directly
        if (promise instanceof AbortablePromise) {
            return promise;
        }

        return new AbortablePromise<T>((resolve, reject) => {
            promise.then(resolve).catch(reject);
        });
    };
}
