import { useCallback, useEffect, useRef, useState } from 'react';

import { type GraphFiatResolution } from '@suite-common/wallet-types';

import { type GraphRange } from 'src/types/wallet/graph';

import { LIVELINE_WINDOW_TRANSITION_MS } from './graphViewUtils';

type UseResolutionTransitionParams<T> = {
    identityKey: string;
    requiredResolution: GraphFiatResolution;
    isDataLoading: boolean;
    hasData: boolean;
    currentData: T;
    currentWindow: number;
    currentRangeLabel: GraphRange['label'];
    merge: (previous: T, next: T) => T;
    evict: (resolution: GraphFiatResolution) => void;
    onIdentityChange?: () => void;
};

type UseResolutionTransitionResult<T> = {
    displayedData: T;
    displayedRangeLabel: GraphRange['label'];
    isTransitioning: boolean;
    displayedWindow: number;
};

export const useResolutionTransition = <T>({
    identityKey,
    requiredResolution,
    isDataLoading,
    hasData,
    currentData,
    currentWindow,
    currentRangeLabel,
    merge,
    evict,
    onIdentityChange,
}: UseResolutionTransitionParams<T>): UseResolutionTransitionResult<T> => {
    const [displayedData, setDisplayedData] = useState<T>(currentData);
    const [displayedWindow, setDisplayedWindow] = useState(currentWindow);
    const [displayedRangeLabel, setDisplayedRangeLabel] = useState(currentRangeLabel);
    const [displayedResolution, setDisplayedResolution] = useState(requiredResolution);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const identityKeyRef = useRef(identityKey);
    // Resolution that was on screen when the current transition started; the
    // graph-fiat reducer entry for this resolution should be evicted once the
    // transition settles. Held in a ref so rapid switches don't lose track of
    // it - the timeout-driven advancement could be superseded before firing.
    const pendingEvictionRef = useRef<GraphFiatResolution | null>(null);
    const transitionTimeoutRef = useRef<number | null>(null);
    const transitionFrameRef = useRef<number | null>(null);
    // `evict` identity changes per render; keep the latest in a ref so the
    // unmount cleanup can fire it without re-running the cleanup effect.
    const evictRef = useRef(evict);
    evictRef.current = evict;
    // The rAF scheduled inside the transition path calls
    // `setDisplayedWindow(currentWindow)`, which would otherwise trigger
    // this effect to re-run because `displayedWindow` is read for the
    // `isZoomingOut` check. That re-run lands back in the transition-start
    // branch and prematurely flushes the pending eviction (the old
    // resolution we deliberately retain across the animation), so reversing
    // the range mid-transition forces a refetch instead of reusing the
    // still-on-screen data. Reading `displayedWindow` via a ref decouples
    // the rAF write from the effect's deps; `isZoomingOut` still sees the
    // latest value because we sync the ref on every render.
    const displayedWindowRef = useRef(displayedWindow);
    displayedWindowRef.current = displayedWindow;

    const clearTransitionTimeout = useCallback(() => {
        if (transitionTimeoutRef.current !== null) {
            window.clearTimeout(transitionTimeoutRef.current);
            transitionTimeoutRef.current = null;
        }
    }, []);

    const clearTransitionFrame = useCallback(() => {
        if (transitionFrameRef.current !== null) {
            window.cancelAnimationFrame(transitionFrameRef.current);
            transitionFrameRef.current = null;
        }
    }, []);

    // Flush any pending eviction synchronously. Used when a transition is
    // superseded, snapped, or the component unmounts mid-transition.
    const flushPendingEviction = useCallback((except?: GraphFiatResolution) => {
        const pending = pendingEvictionRef.current;
        if (pending !== null && pending !== except) {
            evictRef.current(pending);
        }
        pendingEvictionRef.current = null;
    }, []);

    useEffect(
        () => () => {
            clearTransitionTimeout();
            clearTransitionFrame();
            flushPendingEviction();
        },
        [clearTransitionFrame, clearTransitionTimeout, flushPendingEviction],
    );

    useEffect(() => {
        // Identity changed → SNAP
        if (identityKeyRef.current !== identityKey) {
            clearTransitionTimeout();
            clearTransitionFrame();
            flushPendingEviction(requiredResolution);
            identityKeyRef.current = identityKey;
            setDisplayedData(currentData);
            setDisplayedWindow(currentWindow);
            setDisplayedRangeLabel(currentRangeLabel);
            setDisplayedResolution(requiredResolution);
            setIsTransitioning(false);
            onIdentityChange?.();

            return;
        }

        // Same resolution → SNAP
        if (displayedResolution === requiredResolution) {
            clearTransitionTimeout();
            clearTransitionFrame();
            flushPendingEviction(requiredResolution);
            setDisplayedData(currentData);
            setDisplayedWindow(currentWindow);
            setDisplayedRangeLabel(currentRangeLabel);
            setIsTransitioning(false);

            return;
        }

        // Data not ready → WAIT
        if (!hasData || isDataLoading) {
            return;
        }

        // Resolution change → MERGE then timeout → SNAP + EVICT
        // If a previous transition was already pending, evict its orphaned
        // resolution now (unless it happens to be where we're heading).
        flushPendingEviction(requiredResolution);
        pendingEvictionRef.current = displayedResolution;

        const isZoomingOut = currentWindow > displayedWindowRef.current;

        clearTransitionTimeout();
        clearTransitionFrame();
        setIsTransitioning(true);
        setDisplayedData(previous => merge(currentData, previous));
        if (!isZoomingOut) {
            setDisplayedRangeLabel(currentRangeLabel);
        }
        transitionFrameRef.current = window.requestAnimationFrame(() => {
            setDisplayedWindow(currentWindow);
            transitionFrameRef.current = null;
        });

        transitionTimeoutRef.current = window.setTimeout(() => {
            setDisplayedData(currentData);
            setDisplayedWindow(currentWindow);
            setDisplayedRangeLabel(currentRangeLabel);
            setDisplayedResolution(requiredResolution);
            setIsTransitioning(false);
            flushPendingEviction(requiredResolution);
            transitionTimeoutRef.current = null;
        }, LIVELINE_WINDOW_TRANSITION_MS);
    }, [
        clearTransitionTimeout,
        clearTransitionFrame,
        currentData,
        currentRangeLabel,
        currentWindow,
        displayedResolution,
        // `displayedWindow` is intentionally NOT a dep — see
        // `displayedWindowRef` above. Including it would cause the rAF's
        // `setDisplayedWindow(currentWindow)` to re-trigger this effect
        // and prematurely evict the resolution we're animating away from.
        flushPendingEviction,
        hasData,
        identityKey,
        isDataLoading,
        merge,
        onIdentityChange,
        requiredResolution,
    ]);

    return {
        displayedData,
        displayedRangeLabel,
        isTransitioning,
        displayedWindow,
    };
};
