import { MouseEvent, ReactNode } from 'react';

import styled from 'styled-components';

import { useCollapsible } from './CollapsibleContext';

const Container = styled.div`
    display: contents;
    cursor: pointer;
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
            aria-expanded={isOpen}
            aria-disabled={disabled}
            aria-controls={contentId}
            data-testid={dataTestId}
            onClick={clickHandler}
        >
            {children}
        </Container>
    );
};
