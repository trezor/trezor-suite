import { type Action, type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

type CreateMockDispatchParams<TState, TExtra> = {
    getState: () => TState;
    extra: TExtra;
};

/**
 * Receives every dispatched action, together with the `resolve` of the subscription it belongs to.
 * Calling `resolve` is what tells the test that what it waited for has happened, so a listener can
 * assert on the action first and only then let the test continue. Handing `resolve` an error fails
 * the subscription with it instead, the way jest's own `done(error)` used to.
 */
type DispatchListener = (action: UnknownAction, resolve: (error?: Error) => void) => void;

/** A listener with its subscription's `resolve` already bound to it. */
type SubscribedListener = (action: UnknownAction) => void;

/**
 * An awaitable subscription. Awaiting it waits until the listener calls its `resolve` and rejects if
 * that does not happen in time. The timeout starts only once the subscription is awaited, so a
 * subscription used as a plain listener never rejects behind the test's back.
 */
type DispatchSubscription = PromiseLike<void> & {
    catch: (onRejected: (reason: unknown) => void) => PromiseLike<void>;
    finally: (onFinally: () => void) => PromiseLike<void>;
    unsubscribe: () => void;
};

type OnDispatchOptions = {
    /** How long to wait once the subscription is awaited. Defaults to `DEFAULT_WAIT_TIMEOUT`. */
    timeout?: number;
};

export type MockDispatch<TState, TExtra, TAction extends Action = UnknownAction> = {
    actions: unknown[];
    dispatch: ThunkDispatch<TState, TExtra, TAction>;
    onDispatch: (listener: DispatchListener, options?: OnDispatchOptions) => DispatchSubscription;
};

const DEFAULT_WAIT_TIMEOUT = 1000;

/**
 * Subscriptions that were created but so far neither awaited nor unsubscribed. A test that forgets
 * to await one asserts nothing in its listener while still passing, so they are reported.
 */
const unobservedSubscriptions = new Set<{ creationStack: string }>();

/**
 * Throws if a subscription is still unobserved, and forgets it so that it is reported once only.
 * Registered as an `afterEach` below; exported for its own test.
 */
export const failOnUnobservedSubscriptions = () => {
    if (unobservedSubscriptions.size === 0) return;

    const forgotten = [...unobservedSubscriptions]
        .map(({ creationStack }) => creationStack)
        .join('\n\n');
    unobservedSubscriptions.clear();

    throw new Error(
        `onDispatch subscription was never awaited or unsubscribed, so its listener asserted nothing:\n\n${forgotten}`,
    );
};

// `afterEach` is registered when a test file imports this module, so a forgotten `await` fails the
// test it belongs to. Read off the global to keep this module free of a dependency on jest types.
const registerAfterEach = (globalThis as { afterEach?: (hook: () => void) => void }).afterEach;

registerAfterEach?.(failOnUnobservedSubscriptions);

export const createMockDispatch = <TState, TExtra, TAction extends Action = UnknownAction>({
    getState,
    extra,
}: CreateMockDispatchParams<TState, TExtra>): MockDispatch<TState, TExtra, TAction> => {
    const actions: unknown[] = [];
    const listeners = new Set<SubscribedListener>();

    // Calling a thunk directly in a test bypasses the Redux store and its thunk middleware. This
    // small replacement does the two middleware jobs these tests need: it stores plain actions for
    // assertions, and it runs function actions recursively with the same dispatch, state and extra
    // dependencies.
    const dispatch: ThunkDispatch<TState, TExtra, TAction> = (action: unknown) => {
        if (typeof action === 'function') {
            // Returned rather than awaited: making dispatch async would only make dispatch return a
            // promise, it would not force its caller to await it, and production callbacks such as
            // event listeners intentionally ignore what dispatch returns. A test waits for what a
            // thunk does through `onDispatch` instead.
            return Promise.resolve(action(dispatch, getState, extra));
        }

        actions.push(action);
        listeners.forEach(listener => listener(action as UnknownAction));

        return action;
    };

    /**
     * Subscribes to every dispatched action. The listener decides when the test may continue by
     * calling its `resolve`, so a test waits for the action it actually cares about instead of
     * hoping that everything relevant settles within an unspecific await.
     *
     * Subscribe before triggering the code under test: only actions dispatched afterwards reach the
     * listener.
     */
    const onDispatch = (
        listener: DispatchListener,
        { timeout = DEFAULT_WAIT_TIMEOUT }: OnDispatchOptions = {},
    ): DispatchSubscription => {
        let resolveSubscription = () => {};
        let rejectSubscription = (_reason: Error) => {};
        const resolved = new Promise<void>((resolve, reject) => {
            resolveSubscription = resolve;
            rejectSubscription = reject;
        });

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let isAwaited = false;
        let stopListening = () => {};

        // Where this subscription was created, so that a report about it can point at the test. Held
        // per subscription rather than by its stack, so two created on one line count separately.
        const subscription = { creationStack: new Error('onDispatch').stack ?? 'onDispatch' };

        unobservedSubscriptions.add(subscription);
        const markObserved = () => unobservedSubscriptions.delete(subscription);

        const subscribedListener = (action: UnknownAction) => {
            try {
                listener(action, error => {
                    // Thrown rather than rejected here, so that an error handed to `resolve` takes
                    // the same path as one thrown by a failed assertion in the listener.
                    if (error) throw error;

                    stopListening();
                    resolveSubscription();
                });
            } catch (error) {
                // A listener asserting on the action is the point of this API, so a failed assertion
                // has to fail the awaited subscription. Letting it propagate would instead break
                // whatever dispatched the action, and the test would time out with the assertion
                // lost. With nobody awaiting there is no such place to report it, so it is rethrown.
                stopListening();
                // Reported here, one way or the other, so the afterEach hook stays quiet about it.
                markObserved();

                if (!isAwaited) throw error;

                rejectSubscription(error as Error);
            }
        };

        listeners.add(subscribedListener);

        stopListening = () => {
            clearTimeout(timeoutId);
            listeners.delete(subscribedListener);
        };

        // Awaiting is what arms the timeout: a listener that nobody awaits must not reject.
        const startWaiting = () => {
            isAwaited = true;
            markObserved();
            timeoutId ??= setTimeout(() => {
                stopListening();
                rejectSubscription(
                    new Error(
                        `onDispatch timed out after ${timeout} ms, dispatched actions: ${(
                            actions as UnknownAction[]
                        )
                            .map(action => action.type)
                            .join(', ')}`,
                    ),
                );
            }, timeout);

            return resolved;
        };

        return {
            then: (onFulfilled, onRejected) => startWaiting().then(onFulfilled, onRejected),
            catch: onRejected => startWaiting().catch(onRejected),
            finally: onFinally => startWaiting().finally(onFinally),
            unsubscribe: () => {
                // Unsubscribing is a deliberate way of being done with a subscription, the same as
                // awaiting it, so it is not reported as forgotten either.
                markObserved();
                stopListening();
            },
        };
    };

    return { actions, dispatch, onDispatch };
};
