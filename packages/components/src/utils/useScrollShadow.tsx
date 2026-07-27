import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import styled, { type DefaultTheme } from 'styled-components';

import { type Color } from '@trezor/theme';

type GradientDirection = 'bottom' | 'top' | 'right' | 'left';

interface GradientProps {
    $isVisible: boolean;
    $backgroundColor?: Color;
    $direction: GradientDirection;
}

type MapArgs = {
    $direction: GradientDirection;
    $backgroundColor?: Color;
    theme: DefaultTheme;
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
    const gradientMap: Record<GradientDirection, GradientDirection> = {
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

export const useScrollShadow = ({ externalRef, backgroundColor }: UseScrollShadowProps = {}) => {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const scrollElementRef = externalRef || internalRef;

    const [isScrolledToTop, setIsScrolledToTop] = useState(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const [isScrolledToLeft, setIsScrolledToLeft] = useState(true);
    const [isScrolledToRight, setIsScrolledToRight] = useState(true);

    const setShadows = useCallback(() => {
        if (scrollElementRef?.current) {
            const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } =
                scrollElementRef.current;

            setIsScrolledToTop(scrollTop === 0);
            setIsScrolledToBottom(Math.ceil(scrollTop + clientHeight) >= scrollHeight);
            setIsScrolledToLeft(scrollLeft === 0);
            setIsScrolledToRight(Math.ceil(scrollLeft + clientWidth) >= scrollWidth);
        }
    }, [scrollElementRef]);

    useEffect(() => {
        setShadows();

        const observer = new ResizeObserver(() => {
            setShadows();
        });

        if (scrollElementRef?.current) {
            observer.observe(scrollElementRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [scrollElementRef, setShadows]);

    const onScroll = useCallback(setShadows, [setShadows]);

    const ShadowTop = useCallback(
        () => (
            <Gradient
                $backgroundColor={backgroundColor}
                $isVisible={!isScrolledToTop}
                $direction="top"
            />
        ),
        [backgroundColor, isScrolledToTop],
    );

    const ShadowBottom = useCallback(
        () => (
            <Gradient
                $backgroundColor={backgroundColor}
                $isVisible={!isScrolledToBottom}
                $direction="bottom"
            />
        ),
        [backgroundColor, isScrolledToBottom],
    );

    const ShadowLeft = useCallback(
        () => (
            <Gradient
                $backgroundColor={backgroundColor}
                $isVisible={!isScrolledToLeft}
                $direction="left"
            />
        ),
        [backgroundColor, isScrolledToLeft],
    );

    const ShadowRight = useCallback(
        () => (
            <Gradient
                $backgroundColor={backgroundColor}
                $isVisible={!isScrolledToRight}
                $direction="right"
            />
        ),
        [backgroundColor, isScrolledToRight],
    );

    return {
        scrollElementRef,
        onScroll,
        ShadowContainer,
        ShadowTop,
        ShadowBottom,
        ShadowLeft,
        ShadowRight,
    };
};
