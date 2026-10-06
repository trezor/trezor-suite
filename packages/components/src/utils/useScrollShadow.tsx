import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import styled, { type DefaultTheme } from 'styled-components';

import { type Color } from '@trezor/theme';

type ScrollEdge = 'bottom' | 'top' | 'right' | 'left';

type GradientProps = {
    $isVisible: boolean;
    $backgroundColor?: Color;
    $direction: ScrollEdge;
};

type MapArgs = {
    $direction: ScrollEdge;
    $backgroundColor?: Color;
    theme: DefaultTheme;
};

type EdgeSentinelProps = {
    edge: ScrollEdge;
    rootRef: RefObject<HTMLDivElement | null>;
    onReachedChange: (edge: ScrollEdge, isReached: boolean) => void;
};

type UseScrollShadowProps = {
    externalRef?: RefObject<HTMLDivElement | null>;
    backgroundColor?: Color;
};

export const mapDirectionToGradient = ({
    $direction,
    $backgroundColor,
    theme,
}: MapArgs): string => {
    const gradientColor = $backgroundColor ? theme[$backgroundColor] : theme.surfaceFillRaised;
    const gradientMap: Record<ScrollEdge, ScrollEdge> = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
    };

    return `linear-gradient(to ${gradientMap[$direction]}, ${gradientColor}, rgba(0 0 0 / 0%))`;
};

const ShadowContainer = styled.div`
    overflow: auto;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const Gradient = styled.div<GradientProps>`
    ${({ $direction }) => $direction && `${$direction}: 0;`}
    width: ${({ $direction }) =>
        $direction === 'left' || $direction === 'right' ? '60px' : 'calc(100% - 15px)'};
    height: ${({ $direction }) =>
        $direction === 'left' || $direction === 'right' ? '100%' : '60px'};
    z-index: 1;
    position: absolute;
    pointer-events: none;
    opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
    background: ${({ $direction, $backgroundColor, theme }) =>
        mapDirectionToGradient({ $direction, $backgroundColor, theme })};
`;

// Kept out of flow so it cannot grow the scrollable area, and 1px thick rather than empty so
// that it stays a reliably observable target.
const Sentinel = styled.div<{ $edge: ScrollEdge }>`
    position: absolute;
    ${({ $edge }) => `${$edge}: 0;`}
    ${({ $edge }) =>
        $edge === 'left' || $edge === 'right'
            ? 'top: 0; bottom: 0; width: 1px;'
            : 'left: 0; right: 0; height: 1px;'}
    pointer-events: none;
`;

const SCROLL_EDGES = ['top', 'bottom', 'left', 'right'] as const satisfies ScrollEdge[];

const ALL_EDGES_REACHED: Record<ScrollEdge, boolean> = {
    top: true,
    bottom: true,
    left: true,
    right: true,
};

// A probe pinned to one edge of the scrolled content. The observer reports it as intersecting
// exactly while that edge is inside the viewport of the scroll container, which is what the
// shadow on the opposite side of the container needs to know.
const EdgeSentinel = ({ edge, rootRef, onReachedChange }: EdgeSentinelProps) => {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        const sentinel = sentinelRef.current;

        if (!root || !sentinel) {
            return;
        }

        const observer = new IntersectionObserver(
            entries => {
                const latestEntry = entries.at(-1);

                if (latestEntry) {
                    onReachedChange(edge, latestEntry.isIntersecting);
                }
            },
            { root },
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
            // With nothing left to observe there is nothing to shade either, so the edge counts
            // as reached instead of keeping the last known state around.
            onReachedChange(edge, true);
        };
    }, [edge, rootRef, onReachedChange]);

    return <Sentinel ref={sentinelRef} $edge={edge} />;
};

/**
 * Gradients that fade out the content still hidden beyond an edge of a scroll container.
 *
 * Which edges are reached is resolved by an `IntersectionObserver` watching sentinels placed at
 * the edges of the content, so scrolling neither runs a handler nor reads layout properties such
 * as `scrollTop` — reading those forces a synchronous reflow on every scroll event.
 *
 * `ScrollSentinels` therefore has to be rendered inside the scroll container, in an element that
 * is `position: relative` and spans the whole scrollable content; the sentinels are positioned
 * against that element.
 */
export const useScrollShadow = ({ externalRef, backgroundColor }: UseScrollShadowProps = {}) => {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const scrollElementRef = externalRef || internalRef;

    const [reachedEdges, setReachedEdges] = useState(ALL_EDGES_REACHED);

    const handleReachedChange = useCallback((edge: ScrollEdge, isReached: boolean) => {
        setReachedEdges(previous =>
            previous[edge] === isReached ? previous : { ...previous, [edge]: isReached },
        );
    }, []);

    const ScrollSentinels = useCallback(
        () => (
            <>
                {SCROLL_EDGES.map(edge => (
                    <EdgeSentinel
                        key={edge}
                        edge={edge}
                        rootRef={scrollElementRef}
                        onReachedChange={handleReachedChange}
                    />
                ))}
            </>
        ),
        [scrollElementRef, handleReachedChange],
    );

    const ShadowTop = useCallback(
        () => (
            <Gradient
                $backgroundColor={backgroundColor}
                $isVisible={!reachedEdges.top}
                $direction="top"
            />
        ),
        [backgroundColor, reachedEdges.top],
    );

    const ShadowBottom = useCallback(
        () => (
            <Gradient
                $backgroundColor={backgroundColor}
                $isVisible={!reachedEdges.bottom}
                $direction="bottom"
            />
        ),
        [backgroundColor, reachedEdges.bottom],
    );

    const ShadowLeft = useCallback(
        () => (
            <Gradient
                $backgroundColor={backgroundColor}
                $isVisible={!reachedEdges.left}
                $direction="left"
            />
        ),
        [backgroundColor, reachedEdges.left],
    );

    const ShadowRight = useCallback(
        () => (
            <Gradient
                $backgroundColor={backgroundColor}
                $isVisible={!reachedEdges.right}
                $direction="right"
            />
        ),
        [backgroundColor, reachedEdges.right],
    );

    return {
        scrollElementRef,
        ScrollSentinels,
        ShadowContainer,
        ShadowTop,
        ShadowBottom,
        ShadowLeft,
        ShadowRight,
    };
};
