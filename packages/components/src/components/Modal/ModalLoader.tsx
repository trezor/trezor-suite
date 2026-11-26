import { Component, type ErrorInfo, type ReactNode, Suspense } from 'react';

import { ModalSkeleton } from './ModalSkeleton';

export type ModalLoaderProps = {
    children: ReactNode;
    /** Labels the boundary for React DevTools and the profiler. */
    name?: string;
    /** Shown while the modal's chunk is in flight. */
    fallback?: ReactNode;
    /** Takes the modal's place once it has failed; a function is handed what was thrown. */
    errorFallback?: ReactNode | ((error: unknown) => ReactNode);
    /** Reports the failure. Sentry, a toast and closing the modal belong to the caller. */
    onError?: (error: Error, info: ErrorInfo) => void;
};

/** `null` is a legal thing to throw, so the flag, not the value, says whether it caught. */
type ModalLoaderState = { didCatch: true; error: unknown } | { didCatch: false; error: null };

/**
 * `Suspense` plus an error boundary for a lazy modal, so a failed chunk fails inside the modal
 * instead of replacing all of Suite with the app error screen. A class on purpose: a hook
 * suspending here would be caught by the `Suspense` boundary above. webpack memoises a rejected
 * chunk for the rest of the page load, so the caller closes and reports instead of retrying.
 */
export class ModalLoader extends Component<ModalLoaderProps, ModalLoaderState> {
    state: ModalLoaderState = { didCatch: false, error: null };

    static getDerivedStateFromError(error: unknown): ModalLoaderState {
        return { didCatch: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        this.props.onError?.(error, info);
    }

    render() {
        const { children, name, fallback = <ModalSkeleton />, errorFallback = null } = this.props;
        const { didCatch, error } = this.state;

        if (didCatch) {
            return typeof errorFallback === 'function' ? errorFallback(error) : errorFallback;
        }

        return (
            <Suspense name={name} fallback={fallback}>
                {children}
            </Suspense>
        );
    }
}
