import { useEffect, useRef, useState } from 'react';
import styled, { CSSObject, css } from 'styled-components';
import { useElevation } from '../components/ElevationContext/ElevationContext';
import { Color, Elevation, mapElevationToBackground } from '@trezor/theme';

const ShadowContainer = styled.div`
    overflow: auto;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
`;

interface GradientProps {
    $isVisible: boolean;
    $elevation: Elevation;
    $backgroundColor?: Color;
}

const gradientBase = css<GradientProps>`
    width: 100%;
    height: 45px;
    z-index: 1;
    position: absolute;
    pointer-events: none;
    opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
    transition: all 0.2s ease-in;
`;

const GradientBefore = styled.div<GradientProps>`
    ${gradientBase}
    top: 0;
    background: linear-gradient(
        ${({ $backgroundColor, $elevation, theme }) =>
            $backgroundColor
                ? theme[$backgroundColor]
                : mapElevationToBackground({ $elevation, theme })},
        rgba(0 0 0 / 0%)
    );
`;

const GradientAfter = styled.div<GradientProps>`
    ${gradientBase}
    bottom: 0;
    background: linear-gradient(
        rgba(0 0 0 / 0%),
        ${({ $backgroundColor, $elevation, theme }) =>
            $backgroundColor
                ? theme[$backgroundColor]
                : mapElevationToBackground({ $elevation, theme })}
    );
`;

export const useScrollShadow = () => {
    const scrollElementRef = useRef<HTMLDivElement>(null);
    const [isScrolledToTop, setIsScrolledToTop] = useState(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

    const setShadows = () => {
        if (scrollElementRef?.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollElementRef.current;

            setIsScrolledToTop(scrollTop === 0);
            setIsScrolledToBottom(Math.ceil(scrollTop + clientHeight) >= scrollHeight);
        }
    };

    const { elevation } = useElevation();
    useEffect(() => {
        setShadows();
        window.addEventListener('resize', () => setShadows());
        window.addEventListener('orientationchange', () => setShadows());

        return () => {
            window.removeEventListener('resize', () => setShadows());
            window.removeEventListener('orientationchange', () => setShadows());
        };
    }, []);

    const onScroll = () => {
        setShadows();
    };
    type ShadowProps = { backgroundColor?: Color; style?: CSSObject };

    const ShadowTop = ({ backgroundColor, style }: ShadowProps) => (
        <GradientBefore
            $backgroundColor={backgroundColor}
            $elevation={elevation}
            style={style}
            $isVisible={!isScrolledToTop}
        />
    );
    const ShadowBottom = ({ backgroundColor, style }: ShadowProps) => (
        <GradientAfter
            $backgroundColor={backgroundColor}
            $elevation={elevation}
            style={style}
            $isVisible={!isScrolledToBottom}
        />
    );

    return {
        scrollElementRef,
        onScroll,
        ShadowContainer,
        ShadowTop,
        ShadowBottom,
    };
};
