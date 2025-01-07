import { ReactNode, MouseEvent } from 'react';

import styled from 'styled-components';

import { useCollapsible } from './Collapsible';

const Container = styled.div`
    display: contents;
`;

type CollapsibleToggleProps = {
    children: ReactNode;
    onClick?: () => void;
    'data-testid'?: string;
};

export const CollapsibleToggle = ({
    children,
    onClick,
    'data-testid': dataTestId,
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
            aria-controls={contentId}
            data-testid={dataTestId}
            onClick={clickHandler}
        >
            {children}
        </Container>
    );
};
