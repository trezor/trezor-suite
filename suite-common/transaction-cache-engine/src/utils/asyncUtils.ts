/* eslint-disable require-await */
/* eslint-disable @typescript-eslint/no-use-before-define */

import { AccountUniqueKey, AccountUniqueParams } from '../types';

/**
 * @description This function will retry the promiseFn until it returns a response with success: true which is Trezor Connect specific.
 */
export function retryConnectPromise<T extends { success: boolean }>(
    promiseFn: () => Promise<T>,
    maxRetries = Infinity,
    timeout = 1000,
): Promise<T> {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const executePromise = () => {
            attempts++;
            promiseFn()
                .then(response => {
                    if (response.success) {
                        resolve(response);
                    } else {
                        retryOrReject();
                    }
                })
                .catch(retryOrReject);
        };

        const retryOrReject = () => {
            if (attempts < maxRetries) {
                setTimeout(executePromise, timeout);
            } else {
                reject(new Error('Max retries reached'));
            }
        };

        executePromise();
    });
}

/**
 * @description This function will ensure that there is only one ongoing promise for a given function with given arguments.
 * If there is an ongoing promise, it will return the same promise.
 */

export function ensureSingleRunningInstance<T extends (...args: any[]) => Promise<any>>(
    func: T,
): T {
    const ongoingPromises = new Map<string, Promise<any>>();

    return function (this: any, ...args: Parameters<T>): ReturnType<T> {
        const key = JSON.stringify(args);
        if (!ongoingPromises.has(key)) {
            const promise = func.apply(this, args).finally(() => {
                ongoingPromises.delete(key);
            });
            ongoingPromises.set(key, promise);
        }

        return ongoingPromises.get(key) as ReturnType<T>;
    } as unknown as T;
}

/**
 * @description This decorator will ensure that there is only one ongoing promise for a given function with given arguments.
 * If there is an ongoing promise, it will return the same promise.
 * This decorator can be used only on methods.
 */
export function EnsureSingleRunningInstance() {
    return function <T extends (...args: any[]) => Promise<any>>(
        originalMethod: T,
        _context: ClassMethodDecoratorContext,
    ) {
        const replacementMethod = async function (
            this: any,
            ...args: any[]
        ): Promise<ReturnType<T>> {
            return ensureSingleRunningInstance(originalMethod).apply(this, args) as ReturnType<T>;
        } as unknown as T;

        return replacementMethod;
    };
}

// Use global variable to keep track of currently running transaction fetches.
// It would be better to use something that works in context of class instance, but it's quite hard to that in decorators.
// We won't use more that one instance anyway so it's fine.
const transactionFetchesPromises = new Map<AccountUniqueKey, Promise<void>>();

/**
 * @description This decorator keep track of currently running transactions fetches.
 * We need to know that because we need to wait for them to finish in other methods like getTransactions etc.
 */
export function TrackRunningTransactionFetches() {
    return function (
        originalMethod: (args: AccountUniqueParams & any) => Promise<any>,
        _context: ClassMethodDecoratorContext,
    ) {
        function replacementMethod(this: any, args: AccountUniqueParams) {
            const key = getAccountUniqueKey(args);
            if (!transactionFetchesPromises.has(key)) {
                const operation = originalMethod
                    .apply(this, [args])
                    .finally(() => transactionFetchesPromises.delete(key));
                transactionFetchesPromises.set(key, operation);

                return operation;
            }

            return transactionFetchesPromises.get(key)!;
        }

        return replacementMethod;
    };
}

/**
 * @description This decorator will wait until all transaction fetches for that account are finished and then call method.
 */
export function WaitUntilFetchIsFinished() {
    return function (originalMethod: any, _context: ClassMethodDecoratorContext) {
        async function replacementMethod(this: any, args: AccountUniqueParams) {
            const key = getAccountUniqueKey(args);
            if (transactionFetchesPromises.has(key)) {
                try {
                    await transactionFetchesPromises.get(key);
                } catch (error) {
                    // Ignoring the error as per original logic
                }
            }

            return originalMethod.call(this, args);
        }

        return replacementMethod;
    };
}

/**
 * @description This function will return a unique key for a given account.
 * This key can be used to identify the account in the storage/cache etc.
 */
export function getAccountUniqueKey({ coin, descriptor }: AccountUniqueParams): AccountUniqueKey {
    return `${coin}-${descriptor}` as AccountUniqueKey;
}
