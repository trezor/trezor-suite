/* eslint-disable max-classes-per-file, no-underscore-dangle */
// from https://github.com/zzdjk6/simple-abortable-promise

// When abort happens, this error will be throw
export class AbortError extends Error {
    constructor(message = 'Aborted') {
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
    // Method definition `.abort()`
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
        abortControllerParam?: AbortController,
    ) {
        const abortController = abortControllerParam || new AbortController();
        const abortSignal = abortController.signal;

        // This is the executor function to be passed to the superclass - Promise
        const normalExecutor: ExecutorFunction<T> = (resolve, reject) => {
            abortSignal.addEventListener('abort', () => {
                reject(new AbortError(this.abortReason));
            });

            executor(resolve, reject, abortSignal);
        };
        // @ts-expect-error ?
        super(normalExecutor);

        // Bind the abort method
        this.abort = reason => {
            this._abortReason = reason || 'Aborted';
            abortController.abort();
        };
    }

    // Wrap other Promise instances to AbortablePromise
    // eslint-disable-next-line @typescript-eslint/no-shadow
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
