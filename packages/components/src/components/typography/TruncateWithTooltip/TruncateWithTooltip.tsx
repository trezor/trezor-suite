import styled from 'styled-components';
import { useEffect, useRef, useState } from 'react';
import { TooltipDelay, Tooltip } from '../../Tooltip/Tooltip';

const EllipsisContainer = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
`;

export interface TruncateWithTooltipProps {
    children: React.ReactNode;
    delayShow?: TooltipDelay;
}

export const TruncateWithTooltip = ({ children, delayShow }: TruncateWithTooltipProps) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const { scrollWidth, scrollHeight } = containerRef.current;
        const resizeObserver = new ResizeObserver(entries => {
            const { inlineSize: elementWidth, blockSize: elementHeight } =
                entries[0].borderBoxSize?.[0];
            setIsTooltipVisible(scrollWidth > elementWidth || scrollHeight > elementHeight);
        });
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, [children, containerRef]);

    return (
        <EllipsisContainer ref={containerRef}>
            {isTooltipVisible ? (
                <Tooltip delayShow={delayShow} content={children}>
                    <EllipsisContainer>{children}</EllipsisContainer>
                </Tooltip>
            ) : (
                children
            )}
        </EllipsisContainer>
    );
};
