import { useCallback, useState, useEffect } from 'react';

interface Dimensions {
    height: number;
    scrollHeight: number;
    scrollTop: number;
    hasScroll: boolean;
}
// top: 'x' in rect ? rect.x : rect.top,
// left: 'y' in rect ? rect.y : rect.left,
// x: 'x' in rect ? rect.x : rect.left,
// y: 'y' in rect ? rect.y : rect.top,
const getDimensions = (node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    return {
        height: rect.height,
        scrollHeight: node.scrollHeight,
        scrollTop: node.scrollTop,
        hasScroll: Math.round(rect.height) < node.scrollHeight,
    };
};

export const useScrollRef = () => {
    const [node, setNode] = useState<HTMLDivElement | null>(null);
    const [dimensions, setDimensions] = useState<Dimensions | undefined>(undefined);

    const updateDimensions = useCallback(() => {
        if (node) {
            setDimensions(getDimensions(node));
        }
    }, [node]);

    const ref = useCallback(node => setNode(node), []);

    useEffect(() => {
        if (!node) return;
        const measure = () =>
            window.requestAnimationFrame(() => setDimensions(getDimensions(node)));

        setDimensions(getDimensions(node));

        window.addEventListener('resize', measure);
        node.addEventListener('scroll', measure);

        return () => {
            window.removeEventListener('resize', measure);
            node.removeEventListener('scroll', measure);
        };
    }, [node]);

    return {
        ref,
        dimensions,
        updateDimensions,
    };
};
