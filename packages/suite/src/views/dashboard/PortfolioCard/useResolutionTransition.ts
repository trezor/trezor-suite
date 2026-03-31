import { useCallback, useEffect, useRef, useState } from 'react';

import { type GraphFiatResolution } from '@suite-common/wallet-types';

import { type GraphRange } from 'src/types/wallet/graph';

import { LIVELINE_WINDOW_TRANSITION_MS } from './graphViewUtils';

type UseResolutionTransitionParams<T> = {
    identityKey: string;
    isLive: boolean;
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
    displayedResolution: GraphFiatResolution;
    isTransitioning: boolean;
    displayedWindow: number;
};

export const useResolutionTransition = <T>({
    identityKey,
    isLive,
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
    const previousResolutionRef = useRef(requiredResolution);
    const transitionTimeoutRef = useRef<number | null>(null);
    const transitionFrameRef = useRef<number | null>(null);

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

    useEffect(
        () => () => {
            clearTransitionTimeout();
            clearTransitionFrame();
        },
        [clearTransitionFrame, clearTransitionTimeout],
    );

    useEffect(() => {
        // Identity changed → SNAP
        if (identityKeyRef.current !== identityKey) {
            clearTransitionTimeout();
            clearTransitionFrame();
            identityKeyRef.current = identityKey;
            previousResolutionRef.current = requiredResolution;
            setDisplayedData(currentData);
            setDisplayedWindow(currentWindow);
            setDisplayedRangeLabel(currentRangeLabel);
            setDisplayedResolution(requiredResolution);
            setIsTransitioning(false);
            onIdentityChange?.();

            return;
        }

        // Live mode → SNAP
        if (isLive) {
            clearTransitionTimeout();
            clearTransitionFrame();
            setDisplayedData(currentData);
            setDisplayedWindow(currentWindow);
            setDisplayedRangeLabel(currentRangeLabel);
            setDisplayedResolution(requiredResolution);
            setIsTransitioning(false);
            previousResolutionRef.current = requiredResolution;

            return;
        }

        // Same resolution → SNAP
        if (displayedResolution === requiredResolution) {
            clearTransitionTimeout();
            clearTransitionFrame();
            setDisplayedData(currentData);
            setDisplayedWindow(currentWindow);
            setDisplayedRangeLabel(currentRangeLabel);
            setIsTransitioning(false);
            previousResolutionRef.current = requiredResolution;

            return;
        }

        // Data not ready → WAIT
        if (!hasData || isDataLoading) {
            return;
        }

        // Resolution change → MERGE then timeout → SNAP + EVICT
        const previousResolution = previousResolutionRef.current;
        const isZoomingOut = currentWindow > displayedWindow;

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
            previousResolutionRef.current = requiredResolution;
            evict(previousResolution);
            transitionTimeoutRef.current = null;
        }, LIVELINE_WINDOW_TRANSITION_MS);
    }, [
        clearTransitionTimeout,
        clearTransitionFrame,
        currentData,
        currentRangeLabel,
        currentWindow,
        displayedResolution,
        displayedWindow,
        evict,
        hasData,
        identityKey,
        isDataLoading,
        isLive,
        merge,
        onIdentityChange,
        requiredResolution,
    ]);

    return {
        displayedData,
        displayedRangeLabel,
        displayedResolution,
        isTransitioning,
        displayedWindow,
    };
};
