import styled from 'styled-components';
import { useEffect, useRef, useState } from 'react';
import { Tooltip } from '../../Tooltip/Tooltip';

const EllipsisContainer = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
`;

export interface TruncateWithTooltipProps {
    children: React.ReactNode;
    delay?: number;
}

export const TruncateWithTooltip = ({ children, delay }: TruncateWithTooltipProps) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            const { scrollWidth, clientWidth } = containerRef.current;

            if (scrollWidth > clientWidth) {
                setIsTooltipVisible(true);
            }
        }
    }, [children, containerRef]);

    return (
        <EllipsisContainer ref={containerRef}>
            {isTooltipVisible ? (
                <Tooltip delay={delay} content={children}>
                    <EllipsisContainer>{children}</EllipsisContainer>
                </Tooltip>
            ) : (
                children
            )}
        </EllipsisContainer>
    );
};
