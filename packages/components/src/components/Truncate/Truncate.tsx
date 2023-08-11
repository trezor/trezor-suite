import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import ReactTruncate from 'react-truncate';
import { Icon } from '../Icon/Icon';

const TruncateWrapper = styled.div`
    width: 100%;
`;

const StyledButton = styled.button`
    background: none;
    border: 0;
    padding: 5px;
    margin: 0 0 0 5px;
    cursor: pointer;
    display: inline-block;
    width: 25px;
    height: auto;
    position: relative;
    top: 2px;
    line-height: 1;
`;

type TruncateProps = {
    children: React.ReactNode;
    lines?: number;
};

const Truncate = ({ children, lines = 1 }: TruncateProps) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [truncated, setTruncated] = useState(false);

    const handleTruncate = () => {
        setTruncated(truncated);
    };

    const toggleLines = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        setExpanded(!expanded);
    };

    return (
        <TruncateWrapper>
            <ReactTruncate
                lines={!expanded && lines}
                ellipsis={
                    <span>
                        ...{' '}
                        <StyledButton type="button" onClick={toggleLines}>
                            <Icon icon="ARROW_DOWN" color={theme.TYPE_DARK_GREY} size={14} />
                        </StyledButton>
                    </span>
                }
                onTruncate={handleTruncate}
            >
                {children}
            </ReactTruncate>
            {!truncated && expanded && (
                <StyledButton type="button" onClick={toggleLines}>
                    <Icon icon="ARROW_UP" color={theme.TYPE_DARK_GREY} size={14} />
                </StyledButton>
            )}
        </TruncateWrapper>
    );
};

export { Truncate };
