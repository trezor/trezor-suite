import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { Tooltip, type AllowedFrameProps as TooltipAllowedFrameProps } from '../../Tooltip/Tooltip';
import { TooltipDelay } from '../../Tooltip/TooltipDelay';

const EllipsisContainer = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
`;

export interface TruncateWithTooltipProps extends TooltipAllowedFrameProps {
    children: React.ReactNode;
    delayShow?: TooltipDelay;
}

export const TruncateWithTooltip = ({ children, delayShow, ...rest }: TruncateWithTooltipProps) => {
    const [isEllipsisActive, setEllipsisActive] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            const scrollWidth = containerRef.current?.scrollWidth ?? null;
            const scrollHeight = containerRef.current?.scrollHeight ?? null;
            const borderBoxSize = entries[0].borderBoxSize?.[0];
            if (!borderBoxSize || !scrollWidth || !scrollHeight) {
                return;
            }

            const { inlineSize: elementWidth, blockSize: elementHeight } = borderBoxSize;

            const nextEllipsisActive =
                scrollWidth > Math.ceil(elementWidth) || scrollHeight > Math.ceil(elementHeight);

            setEllipsisActive(nextEllipsisActive);
        });
        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, [children]);

    return (
        <EllipsisContainer ref={containerRef}>
            <Tooltip
                isActive={Boolean(children) && isEllipsisActive}
                delayShow={delayShow}
                content={children ?? null}
                {...rest}
            >
                {isEllipsisActive ? <EllipsisContainer>{children}</EllipsisContainer> : children}
            </Tooltip>
        </EllipsisContainer>
    );
};
