import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const VISIBLE_CLASS = 'visible';

const FadingDiv = styled.div<{ duration: number }>`
    opacity: 0;
    transition: opacity ${props => props.duration}s;
    &.${VISIBLE_CLASS} {
        opacity: 1;
    }
`;

export type FadeProps = {
    threshold?: number;
    duration?: number;
    direction?: 'IN' | 'OUT' | 'IN-OUT';
};

export const Fade: React.FC<FadeProps> = ({
    children,
    threshold = 0.5,
    duration = 1,
    direction = 'IN-OUT',
}) => {
    const [div, setDiv] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!div) return;
        if (!('IntersectionObserver' in window)) {
            div.classList?.add(VISIBLE_CLASS);
            return;
        }
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.intersectionRatio >= threshold) {
                        if (direction !== 'OUT') {
                            entry.target?.classList?.add(VISIBLE_CLASS);
                        }
                    } else if (direction !== 'IN') {
                        entry.target?.classList?.remove(VISIBLE_CLASS);
                    }
                });
            },
            { threshold },
        );
        observer.observe(div);
        return () => observer.unobserve(div);
    }, [div, threshold, direction]);

    return (
        <FadingDiv duration={duration} ref={setDiv}>
            {children}
        </FadingDiv>
    );
};
