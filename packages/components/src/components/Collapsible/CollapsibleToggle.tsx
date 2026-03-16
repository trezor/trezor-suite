import { type MouseEvent, type ReactNode } from 'react';

import styled from 'styled-components';

import { useCollapsible } from './CollapsibleContext';

const Container = styled.div<{ $disabled?: boolean }>`
    display: contents;
    cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
`;

type CollapsibleToggleProps = {
    children: ReactNode;
    onClick?: () => void;
    'data-testid'?: string;
    disabled?: boolean;
};

export const CollapsibleToggle = ({
    children,
    onClick,
    'data-testid': dataTestId,
    disabled,
}: CollapsibleToggleProps) => {
    const { toggle, isOpen, contentId } = useCollapsible();

    const clickHandler = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        (onClick ?? (() => toggle(!isOpen)))();
    };

    return (
        <Container
            role="button"
            tabIndex={0}
            aria-disabled={disabled}
            aria-expanded={isOpen}
            aria-controls={contentId}
            data-testid={dataTestId}
            onClick={clickHandler}
            $disabled={disabled}
        >
            {children}
        </Container>
    );
};
