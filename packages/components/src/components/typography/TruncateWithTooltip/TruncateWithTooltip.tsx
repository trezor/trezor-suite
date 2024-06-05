import styled from 'styled-components';
import { useEffect, useRef, useState } from 'react';
import { Tooltip, Cursor } from '../../Tooltip/Tooltip';
import { TooltipDelay } from '../../Tooltip/TooltipDelay';

const EllipsisContainer = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
`;

export interface TruncateWithTooltipProps {
    children: React.ReactNode;
    delayShow?: TooltipDelay;
    cursor?: Cursor;
}

export const TruncateWithTooltip = ({
    children,
    delayShow,
    cursor = 'inherit',
}: TruncateWithTooltipProps) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);

    const scrollWidth = containerRef.current?.scrollWidth ?? null;
    const scrollHeight = containerRef.current?.scrollHeight ?? null;

    useEffect(() => {
        if (!containerRef.current || !scrollWidth || !scrollHeight) return;
        const resizeObserver = new ResizeObserver(entries => {
            const { inlineSize: elementWidth, blockSize: elementHeight } =
                entries[0].borderBoxSize?.[0];
            setIsTooltipVisible(
                scrollWidth > Math.ceil(elementWidth) || scrollHeight > Math.ceil(elementHeight),
            );
        });
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, [children, scrollWidth, scrollHeight]);

    return (
        <EllipsisContainer ref={containerRef}>
            {isTooltipVisible ? (
                <Tooltip delayShow={delayShow} content={children} cursor={cursor}>
                    <EllipsisContainer>{children}</EllipsisContainer>
                </Tooltip>
            ) : (
                children
            )}
        </EllipsisContainer>
    );
};
